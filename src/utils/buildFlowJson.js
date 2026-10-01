import nodeDefinitions from '../data/nodeDefinitions'
import { collectLinkedScreenIds } from './linkedScreens'

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
const buildFormChildren = (items, currentScreenId, itemInfoMap) => items
    .filter((item) => !item.isPreview)
    .map((item) => {
        const node = findDefinition(item.type)?.toJson(item.config ?? {}, { name: item.config?.id || item.name });
        if (!node) return null;
        return wrapWithVisibility(withLinkedScreenId(node), item.config?.visibilityConditions, currentScreenId, itemInfoMap);
    })
    .filter(Boolean);

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
const buildPayload = (ownFields, forwardedEntries) => {
    const payload = {};
    ownFields.forEach(({ key, formRef }) => { payload[key] = formRef; });
    forwardedEntries.forEach(({ key }) => { payload[key] = `\${data.${key}}`; });
    return payload;
};

const buildFooter = (screen, screens, screenIndex, ownFields, forwardedEntries, targetScreenIdOverride) => {
    const nextScreen = screens[screenIndex + 1];
    const targetScreenId = targetScreenIdOverride !== undefined ? targetScreenIdOverride : nextScreen?.id;
    const payload = buildPayload(ownFields, forwardedEntries);
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
const buildFooterWithJump = (screen, screens, screenIndex, ownFields, forwardedEntries, jumpItem) => {
    const elseFooter = buildFooter(screen, screens, screenIndex, ownFields, forwardedEntries);
    if (!jumpItem) return elseFooter;

    const fieldName = jumpItem.config?.id || jumpItem.name;
    const thenFooter = buildFooter(screen, screens, screenIndex, ownFields, forwardedEntries, jumpItem.config.jumpCondition.screenId);
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

const buildScreen = (screen, screens, screenIndex, forwardedEntries, mainScreenIds, itemInfoMap) => {
    const formChildren = buildFormChildren(screen.items, screen.id, itemInfoMap);
    const ownFields = ownFieldsOf(formChildren, screen.name);
    const jumpItem = findJumpItem(screen, mainScreenIds);
    const footer = buildFooterWithJump(screen, screens, screenIndex, ownFields, forwardedEntries, jumpItem);

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
const buildRoutingModel = (mainScreens, mainScreenIds) => mainScreens.reduce((routingModel, screen, screenIndex) => {
    const jumpItem = findJumpItem(screen, mainScreenIds);
    const nextScreen = mainScreens[screenIndex + 1];
    const targets = [...new Set([jumpItem?.config.jumpCondition.screenId, nextScreen?.id].filter(Boolean))];
    if (targets.length) routingModel[screen.id] = targets;
    return routingModel;
}, {});

// Builds the full WhatsApp Flow JSON document from the current screens/items state.
export const buildFlowJson = (screens) => {
    const linkedScreenIds = collectLinkedScreenIds(screens);
    const mainScreens = screens.filter((screen) => !linkedScreenIds.has(screen.id));
    const linkedScreens = screens.filter((screen) => linkedScreenIds.has(screen.id));
    const mainScreenIds = new Set(mainScreens.map((screen) => screen.id));
    const itemInfoMap = buildItemInfoMap(screens);

    let forwardedEntries = [];
    const builtMainScreens = mainScreens.map((screen, screenIndex) => {
        const { screen: builtScreen, ownFields } = buildScreen(screen, mainScreens, screenIndex, forwardedEntries, mainScreenIds, itemInfoMap);
        // Everything this screen owns gets carried forward to every screen after it.
        forwardedEntries = [...forwardedEntries, ...ownFields];
        return builtScreen;
    });

    const builtLinkedScreens = linkedScreens.map((screen) => buildLinkedScreen(screen, itemInfoMap));
    const hasJumps = mainScreens.some((screen) => findJumpItem(screen, mainScreenIds));

    return {
        version: '7.3',
        ...(hasJumps ? { routing_model: buildRoutingModel(mainScreens, mainScreenIds) } : {}),
        screens: [...builtMainScreens, ...builtLinkedScreens],
    };
};
