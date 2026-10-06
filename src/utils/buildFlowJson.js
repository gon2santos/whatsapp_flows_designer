import nodeDefinitions from '../data/nodeDefinitions'
import { collectLinkedScreenIds } from './linkedScreens'
import { hasMarkdown } from './markdownShortcuts'

const findDefinition = (type) => nodeDefinitions.find((definition) => definition.type === type);

// WhatsApp Flow requires OptIn "read more" targets to use this id prefix and stay out of the main flow.
const LINKED_SCREEN_ID_PREFIX = 'OPTIN_SCREEN_';

// Points an OptIn node's own on-click-action at the linked screen's final (prefixed) id.
const withLinkedScreenId = (node) => (
    node['on-click-action']?.next?.name
        ? {
            ...node,
            'on-click-action': {
                ...node['on-click-action'],
                next: { ...node['on-click-action'].next, name: `${LINKED_SCREEN_ID_PREFIX}${node['on-click-action'].next.name}` },
            },
        }
        : node
);

// Payload key used to carry a screen's answer forward through the navigate/complete chain.
const screenSlug = (screenName) => screenName.replace(/\s+/g, '_');
const payloadKey = (screenName, fieldName) => `${screenSlug(screenName)}_${fieldName}`;

// Maps every item's stable id to where its answer lives: which screen it belongs to, its resolved
// WhatsApp Flow field name, and the payload key it's forwarded under once it leaves that screen.
// Needed because a "Visibility" condition can reference a node from an earlier screen.
const buildItemInfoMap = (screens) => {
    const itemInfoMap = new Map();
    screens.forEach((screen) => {
        screen.items.forEach((item) => {
            if (item.isPreview) return;
            const fieldName = item.config?.id || item.name;
            itemInfoMap.set(item.id, { screenId: screen.id, fieldName, payloadKey: payloadKey(screen.name, fieldName) });
        });
    });
    return itemInfoMap;
};

// Nests a node inside "If" wrappers for each of its (complete) Visibility conditions, outermost first,
// matching how WhatsApp Flow requires multiple conditions to be expressed as nested "If" nodes.
// A condition sourced from the current screen reads "${form.<name>}"; from an earlier screen it must
// read "${data.<payloadKey>}", since that's the only place the value is available once forwarded.
const wrapWithVisibility = (node, conditions, currentScreenId, itemInfoMap) => {
    const validConditions = (conditions ?? []).filter((condition) => condition.nodeId && condition.optionId && itemInfoMap.has(condition.nodeId));
    return validConditions.reduceRight((child, condition) => {
        const info = itemInfoMap.get(condition.nodeId);
        const reference = info.screenId === currentScreenId ? `\${form.${info.fieldName}}` : `\${data.${info.payloadKey}}`;
        return {
            type: 'If',
            condition: `${reference} ${condition.operator === 'not-equals' ? '!=' : '=='} '${condition.optionId}'`,
            then: [child],
        };
    }, node);
};

// Each real (non-preview) node knows how to render its own WhatsApp Flow JSON via definition.toJson.
// A user-provided config.id overrides the auto-generated item.name as the payload/form field key.
// config.topText is rendered as a standalone TextBody right above the node, never shown in the designer's form.
const buildTopTextNode = (topText) => (
    hasMarkdown(topText) ? { type: 'TextBody', markdown: true, text: [topText] } : { type: 'TextBody', text: topText }
);

const buildFormChildren = (items, currentScreenId, itemInfoMap) => items
    .filter((item) => !item.isPreview)
    .flatMap((item) => {
        const node = findDefinition(item.type)?.toJson(item.config ?? {}, { name: item.config?.id || item.name });
        if (!node) return [];
        const wrapped = wrapWithVisibility(withLinkedScreenId(node), item.config?.visibilityConditions, currentScreenId, itemInfoMap);
        const topText = item.config?.topText?.trim();
        return topText ? [buildTopTextNode(topText), wrapped] : [wrapped];
    });

// The runtime value type each WhatsApp Flow component produces, used to keep the forwarded data-model schema accurate.
const DATA_TYPE_BY_WA_TYPE = {
    TextInput: 'string',
    TextArea: 'string',
    DatePicker: 'string',
    Dropdown: 'string',
    RadioButtonsGroup: 'string',
    CheckboxGroup: 'array',
    OptIn: 'boolean',
};

const exampleValueFor = (dataType) => {
    if (dataType === 'boolean') return true;
    if (dataType === 'array') return ['Example'];
    return 'Example';
};

// Looks through "If" wrappers (added by Visibility conditions) to reach the actual field nodes inside.
const flattenConditionalNodes = (nodes) => nodes.flatMap((node) => (
    node.type === 'If' ? flattenConditionalNodes([...(node.then ?? []), ...(node.else ?? [])]) : [node]
));

// Only nodes with a "name" (TextInput, Dropdown, DatePicker, etc.) hold a user answer worth forwarding.
const ownFieldsOf = (formChildren, screenName) => flattenConditionalNodes(formChildren)
    .filter((node) => typeof node.name === 'string')
    .map((node) => ({
        key: payloadKey(screenName, node.name),
        formRef: `\${form.${node.name}}`,
        dataType: DATA_TYPE_BY_WA_TYPE[node.type] ?? 'string',
    }));

// The payload sent on navigate/complete: this screen's own answers, then everything forwarded from earlier screens.
// WhatsApp Flow requires a navigate payload to match the target screen's declared data model exactly, so when a
// screen is reachable through more than one path, allowedKeys narrows it down to that target's declared fields.
const buildPayload = (ownFields, forwardedEntries, allowedKeys) => {
    const payload = {};
    const isAllowed = (key) => !allowedKeys || allowedKeys.has(key);
    ownFields.forEach(({ key, formRef }) => { if (isAllowed(key)) payload[key] = formRef; });
    forwardedEntries.forEach(({ key }) => { if (isAllowed(key)) payload[key] = `\${data.${key}}`; });
    return payload;
};

const buildFooter = (screen, screens, screenIndex, ownFields, forwardedEntries, incomingFieldsByScreenId, targetScreenIdOverride) => {
    const nextScreen = screens[screenIndex + 1];
    const targetScreenId = targetScreenIdOverride !== undefined ? targetScreenIdOverride : nextScreen?.id;
    // No target (flow completion) means there's no screen data model to match: forward everything collected so far.
    const allowedKeys = targetScreenId ? new Set((incomingFieldsByScreenId.get(targetScreenId) ?? []).map((field) => field.key)) : null;
    const payload = buildPayload(ownFields, forwardedEntries, allowedKeys);
    return {
        type: 'Footer',
        label: screen.footerLabel || (targetScreenId ? 'Continuar' : 'Finalizar'),
        'on-click-action': targetScreenId
            ? { name: 'navigate', next: { name: targetScreenId, type: 'screen' }, payload }
            : { name: 'complete', payload },
    };
};

// Node types whose config can hold a "Jump to Screen" conditional (config.jumpCondition = { optionId, screenId }).
const JUMP_NODE_TYPES = ['dropdown', 'radio'];

// First item on the screen with a valid, resolvable jump condition, if any.
const findJumpItem = (screen, mainScreenIds) => screen.items.find((item) => {
    const jump = item.config?.jumpCondition;
    return JUMP_NODE_TYPES.includes(item.type) && jump?.optionId && jump?.screenId && mainScreenIds.has(jump.screenId);
});

// Wraps the normal footer in an "If" node that navigates to the jump target when the selected option matches.
const buildFooterWithJump = (screen, screens, screenIndex, ownFields, forwardedEntries, jumpItem, incomingFieldsByScreenId) => {
    const elseFooter = buildFooter(screen, screens, screenIndex, ownFields, forwardedEntries, incomingFieldsByScreenId);
    if (!jumpItem) return elseFooter;

    const fieldName = jumpItem.config?.id || jumpItem.name;
    const thenFooter = buildFooter(screen, screens, screenIndex, ownFields, forwardedEntries, incomingFieldsByScreenId, jumpItem.config.jumpCondition.screenId);
    return {
        type: 'If',
        condition: `\${form.${fieldName}} == '${jumpItem.config.jumpCondition.optionId}'`,
        then: [thenFooter],
        else: [elseFooter],
    };
};

// Declares the shape of the data a screen expects to receive, i.e. everything forwarded from earlier screens.
const buildDataSchema = (forwardedEntries) => forwardedEntries.reduce((schema, { key, dataType }) => {
    schema[key] = {
        '__example__': exampleValueFor(dataType),
        type: dataType,
        ...(dataType === 'array' ? { items: { type: 'string' } } : {}),
    };
    return schema;
}, {});

const buildScreen = (screen, screens, screenIndex, forwardedEntries, mainScreenIds, itemInfoMap, incomingFieldsByScreenId) => {
    const formChildren = buildFormChildren(screen.items, screen.id, itemInfoMap);
    const ownFields = ownFieldsOf(formChildren, screen.name);
    const jumpItem = findJumpItem(screen, mainScreenIds);
    const footer = buildFooterWithJump(screen, screens, screenIndex, ownFields, forwardedEntries, jumpItem, incomingFieldsByScreenId);

    return {
        screen: {
            id: screen.id,
            title: screen.name,
            data: buildDataSchema(forwardedEntries),
            ...(screenIndex === screens.length - 1 ? { terminal: true } : {}),
            layout: {
                type: 'SingleColumnLayout',
                children: [
                    { type: 'Form', name: 'flow_path', children: [...formChildren, footer] },
                ],
            },
        },
        ownFields,
    };
};

// OptIn link targets have no Footer, aren't terminal, and don't need any forwarded data schema.
const buildLinkedScreen = (screen, itemInfoMap) => ({
    id: `${LINKED_SCREEN_ID_PREFIX}${screen.id}`,
    title: screen.name,
    data: {},
    layout: {
        type: 'SingleColumnLayout',
        children: [
            { type: 'Form', name: 'flow_path', children: buildFormChildren(screen.items, screen.id, itemInfoMap) },
        ],
    },
});

// Every screen a jump/normal-next could lead to, used so WhatsApp Flow can validate non-linear navigation.
const screenSuccessors = (screen, screenIndex, mainScreens, mainScreenIds) => {
    const jumpItem = findJumpItem(screen, mainScreenIds);
    const nextScreen = mainScreens[screenIndex + 1];
    return [...new Set([jumpItem?.config.jumpCondition.screenId, nextScreen?.id].filter(Boolean))];
};

const buildRoutingModel = (mainScreens, mainScreenIds) => mainScreens.reduce((routingModel, screen, screenIndex) => {
    const targets = screenSuccessors(screen, screenIndex, mainScreens, mainScreenIds);
    if (targets.length) routingModel[screen.id] = targets;
    return routingModel;
}, {});

// Reverse of screenSuccessors: which screens can navigate directly into each screen.
const buildPredecessorMap = (mainScreens, mainScreenIds) => {
    const predecessors = new Map(mainScreens.map((screen) => [screen.id, []]));
    mainScreens.forEach((screen, screenIndex) => {
        screenSuccessors(screen, screenIndex, mainScreens, mainScreenIds).forEach((targetId) => {
            predecessors.get(targetId)?.push(screen.id);
        });
    });
    return predecessors;
};

// A screen reachable through more than one path (e.g. a Jump that skips over another screen) can only rely on
// the fields every one of those paths actually forwards: the intersection of each predecessor's own fields.
const intersectFieldsByKey = (fieldSets) => {
    const [first, ...rest] = fieldSets;
    if (!first) return [];
    return first.filter((field) => rest.every((otherSet) => otherSet.some((other) => other.key === field.key)));
};

// Builds the full WhatsApp Flow JSON document from the current screens/items state.
export const buildFlowJson = (screens) => {
    const linkedScreenIds = collectLinkedScreenIds(screens);
    const mainScreens = screens.filter((screen) => !linkedScreenIds.has(screen.id));
    const linkedScreens = screens.filter((screen) => linkedScreenIds.has(screen.id));
    const mainScreenIds = new Set(mainScreens.map((screen) => screen.id));
    const itemInfoMap = buildItemInfoMap(screens);
    const predecessorsByScreenId = buildPredecessorMap(mainScreens, mainScreenIds);

    // First pass: resolve every screen's declared (intersection-narrowed) incoming fields before building any
    // footer, since a screen's payload must be filtered against the DECLARED data model of whatever it navigates to.
    const incomingFieldsByScreenId = new Map();
    const outgoingFieldsByScreenId = new Map();
    mainScreens.forEach((screen) => {
        const predecessorIds = predecessorsByScreenId.get(screen.id) ?? [];
        const incomingFields = intersectFieldsByKey(predecessorIds.map((id) => outgoingFieldsByScreenId.get(id) ?? []));
        const ownFields = ownFieldsOf(buildFormChildren(screen.items, screen.id, itemInfoMap), screen.name);
        incomingFieldsByScreenId.set(screen.id, incomingFields);
        outgoingFieldsByScreenId.set(screen.id, [...incomingFields, ...ownFields]);
    });

    const builtMainScreens = mainScreens.map((screen, screenIndex) => {
        const forwardedEntries = incomingFieldsByScreenId.get(screen.id);
        return buildScreen(screen, mainScreens, screenIndex, forwardedEntries, mainScreenIds, itemInfoMap, incomingFieldsByScreenId).screen;
    });

    const builtLinkedScreens = linkedScreens.map((screen) => buildLinkedScreen(screen, itemInfoMap));
    const hasJumps = mainScreens.some((screen) => findJumpItem(screen, mainScreenIds));

    return {
        version: '7.3',
        ...(hasJumps ? { routing_model: buildRoutingModel(mainScreens, mainScreenIds) } : {}),
        screens: [...builtMainScreens, ...builtLinkedScreens],
    };
};

