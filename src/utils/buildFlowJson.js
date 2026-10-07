import nodeDefinitions from '../data/nodeDefinitions'
import { collectLinkedScreenIds } from './linkedScreens'
import { hasMarkdown } from './markdownShortcuts'
import { resolveFooterTarget } from './footerTarget'

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

// Renders one Visibility condition as a bare WhatsApp Flow boolean clause (no surrounding parentheses, no
// "&&"/"||"). A condition sourced from the current screen reads "${form.<name>}"; from an earlier screen it
// must read "${data.<payloadKey>}", since that's the only place the value is available once forwarded.
// WhatsApp Flow's parser has shown to misparse two parenthesized "==" comparisons joined by "&&"/"||" in the
// same condition string (reports a false "type mismatch"), so AND/OR are instead expressed structurally via
// nested "If" components: AND nests through "then", OR chains through "else" (duplicating the guarded nodes
// in every leaf), matching exactly how a single-condition "If" has always worked.
const buildConditionClause = (condition, currentScreenId, itemInfoMap) => {
    const info = itemInfoMap.get(condition.nodeId);
    const reference = info.screenId === currentScreenId ? `\${form.${info.fieldName}}` : `\${data.${info.payloadKey}}`;
    return `${reference} ${condition.operator === 'not-equals' ? '!=' : '=='} '${condition.optionId}'`;
};

// Splits a flat condition list into AND-groups, starting a new group at each "or"-related condition.
const groupConditionsByOr = (conditions) => conditions.reduce((groups, condition) => {
    if (!groups.length || condition.logicalOperator === 'or') groups.push([condition]);
    else groups[groups.length - 1].push(condition);
    return groups;
}, []);

// Nests one "If" per condition in the group (AND), innermost first, guarding the same "then" content throughout.
const nestConditionsAsAnd = (conditions, nodes, currentScreenId, itemInfoMap) => conditions.reduceRight((children, condition) => [{
    type: 'If',
    condition: buildConditionClause(condition, currentScreenId, itemInfoMap),
    then: children,
}], nodes);

// An OR'd group's guarded content gets duplicated into every branch; WhatsApp Flow requires every Form
// component's "name" to be unique screen-wide even across mutually-exclusive If/else branches, so every
// branch after the first needs its own, differently-named copy of any named node (TextInput, Dropdown, etc.).
const renameNamedNodes = (nodes, suffix) => nodes.map((node) => {
    if (!node || typeof node !== 'object') return node;
    const cloned = { ...node };
    if (typeof cloned.name === 'string') cloned.name = `${cloned.name}_${suffix}`;
    ['then', 'else'].forEach((key) => {
        if (Array.isArray(cloned[key])) cloned[key] = renameNamedNodes(cloned[key], suffix);
    });
    return cloned;
});

// Chains each AND-group's outermost "If" into the next group's via "else" (OR). The last group has no
// "else", so nothing renders when none of the OR'd groups match.
const nestGroupsAsOr = (groups, nodes, currentScreenId, itemInfoMap) => groups.reduceRight((elseBranch, group, index) => {
    const branchNodes = index === 0 ? nodes : renameNamedNodes(nodes, `or${index + 1}`);
    const built = nestConditionsAsAnd(group, branchNodes, currentScreenId, itemInfoMap);
    return elseBranch ? [{ ...built[0], else: elseBranch }] : built;
}, null);

// Wraps a node (or node + its Top text) with every Visibility condition. Takes/returns an array so a
// Top text TextBody stays wrapped together with the field it belongs to.
const wrapWithVisibility = (nodes, conditions, currentScreenId, itemInfoMap) => {
    const validConditions = (conditions ?? []).filter((condition) => condition.nodeId && condition.optionId && itemInfoMap.has(condition.nodeId));
    if (!validConditions.length) return nodes;
    return nestGroupsAsOr(groupConditionsByOr(validConditions), nodes, currentScreenId, itemInfoMap);
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
        const topText = item.config?.topText?.trim();
        const nodes = topText ? [buildTopTextNode(topText), withLinkedScreenId(node)] : [withLinkedScreenId(node)];
        return wrapWithVisibility(nodes, item.config?.visibilityConditions, currentScreenId, itemInfoMap);
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
    const targetScreenId = targetScreenIdOverride !== undefined ? targetScreenIdOverride : resolveFooterTarget(screen, screens, screenIndex);
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

// Node types whose config can hold "Jump to Screen" conditionals (config.jumpConditions = [{ optionId, screenId }]).
const JUMP_NODE_TYPES = ['dropdown', 'radio'];

// This item's jump conditions that still point at a real, selectable main screen.
const validJumpConditions = (item, mainScreenIds) => (item.config?.jumpConditions ?? [])
    .filter((jump) => jump?.optionId && jump?.screenId && mainScreenIds.has(jump.screenId));

// First item on the screen with at least one valid, resolvable jump condition, if any.
const findJumpItem = (screen, mainScreenIds) => screen.items.find((item) => (
    JUMP_NODE_TYPES.includes(item.type) && validJumpConditions(item, mainScreenIds).length > 0
));

// Wraps the normal footer in a chain of "If" nodes, one per jump condition (first one checked outermost),
// each navigating to its own target screen when its option matches; falls back to the normal footer otherwise.
const buildFooterWithJump = (screen, screens, screenIndex, ownFields, forwardedEntries, jumpItem, incomingFieldsByScreenId, mainScreenIds) => {
    const fallbackFooter = buildFooter(screen, screens, screenIndex, ownFields, forwardedEntries, incomingFieldsByScreenId);
    const jumps = jumpItem ? validJumpConditions(jumpItem, mainScreenIds) : [];
    if (!jumps.length) return fallbackFooter;

    const fieldName = jumpItem.config?.id || jumpItem.name;
    return jumps.reduceRight((elseFooter, jump) => ({
        type: 'If',
        condition: `\${form.${fieldName}} == '${jump.optionId}'`,
        then: [buildFooter(screen, screens, screenIndex, ownFields, forwardedEntries, incomingFieldsByScreenId, jump.screenId)],
        else: [elseFooter],
    }), fallbackFooter);
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
    const footer = buildFooterWithJump(screen, screens, screenIndex, ownFields, forwardedEntries, jumpItem, incomingFieldsByScreenId, mainScreenIds);

    return {
        screen: {
            id: screen.id,
            title: screen.name,
            data: buildDataSchema(forwardedEntries),
            ...(resolveFooterTarget(screen, screens, screenIndex) === undefined ? { terminal: true } : {}),
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
    const jumpTargets = jumpItem ? validJumpConditions(jumpItem, mainScreenIds).map((jump) => jump.screenId) : [];
    const defaultTarget = resolveFooterTarget(screen, mainScreens, screenIndex);
    return [...new Set([...jumpTargets, defaultTarget].filter(Boolean))];
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

