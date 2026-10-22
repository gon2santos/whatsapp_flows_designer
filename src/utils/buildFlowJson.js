import nodeDefinitions, { MAX_JUMP_CONDITIONS } from '../data/nodeDefinitions'
import { collectLinkedScreenIds } from './linkedScreens'
import { textProps } from './markdownShortcuts'
import { resolveFooterTarget } from './footerTarget'
import { migrateOptionIds } from './migrateOptionIds'
import { NAV_MENU_TYPE, NAV_MENU_WA_TYPE, navMenuItemIds } from './navMenu'

const findDefinition = (type) => nodeDefinitions.find((definition) => definition.type === type);

// WhatsApp Flow requires OptIn "read more" targets to use this id prefix and stay out of the main flow.
const LINKED_SCREEN_ID_PREFIX = 'OPTIN_SCREEN_';

// Points an OptIn node's own on-click-action at the linked screen's final (prefixed) id.
const withLinkedScreenId = (node) => (
    node.type !== NAV_MENU_WA_TYPE && node['on-click-action']?.next?.name
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
            itemInfoMap.set(item.id, {
                screenId: screen.id,
                fieldName,
                screenName: screen.name,
                conditions: item.config?.visibilityConditions,
            });
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
// A condition's "suffix" (e.g. "_or2") targets the renamed copy of a source field that was duplicated by an OR.
const buildConditionClause = (condition, currentScreenId, itemInfoMap) => {
    const info = itemInfoMap.get(condition.nodeId);
    const fieldName = `${info.fieldName}${condition.suffix ?? ''}`;
    const reference = info.screenId === currentScreenId ? `\${form.${fieldName}}` : `\${data.${payloadKey(info.screenName, fieldName)}}`;
    return `${reference} ${condition.operator === 'not-equals' ? '!=' : '=='} '${condition.optionId}'`;
};

// Expands the conditions (with their "("/")" grouping via condition.open/close and AND/OR via logicalOperator)
// into OR'd AND-groups (disjunctive normal form), since only nested "If"s can be emitted. AND binds tighter than OR.
const groupConditionsByOr = (conditions, expand = (condition) => [[condition]]) => {
    const tokens = [];
    let depth = 0;
    conditions.forEach((condition, index) => {
        if (index > 0) tokens.push(condition.logicalOperator === 'or' ? 'or' : 'and');
        for (let i = 0; i < (condition.open ?? 0); i += 1) { tokens.push('('); depth += 1; }
        tokens.push(condition);
        const closes = Math.min(condition.close ?? 0, depth);
        for (let i = 0; i < closes; i += 1) tokens.push(')');
        depth -= closes;
    });
    for (; depth > 0; depth -= 1) tokens.push(')');

    let pos = 0;
    const parseFactor = () => {
        if (tokens[pos] === '(') {
            pos += 1;
            const inner = parseOr();
            pos += 1;
            return inner;
        }
        const condition = tokens[pos];
        pos += 1;
        return expand(condition);
    };
    const parseAnd = () => {
        let result = parseFactor();
        while (tokens[pos] === 'and') {
            pos += 1;
            const next = parseFactor();
            result = result.flatMap((left) => next.map((right) => [...left, ...right]));
        }
        return result;
    };
    function parseOr() {
        let result = parseAnd();
        while (tokens[pos] === 'or') {
            pos += 1;
            result = [...result, ...parseAnd()];
        }
        return result;
    }
    return tokens.length ? parseOr() : [];
};

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
// When the groups can never hold at once (e.g. tipo == A vs tipo == B) they are emitted as flat sibling Ifs
// instead: WhatsApp Flow's 3-level If limit counts every "else" link, so chains plus inner Ifs overflow it.
const groupsAreExclusive = (groups) => groups.every((group, i) => groups.every((other, j) => (
    j <= i || group.some((a) => other.some((b) => contradicts(a, b)))
)));

const nestGroupsAsOr = (groups, nodes, currentScreenId, itemInfoMap) => {
    const branchNodesFor = (index) => (index === 0 ? nodes : renameNamedNodes(nodes, `or${index + 1}`));
    if (groups.length > 1 && groupsAreExclusive(groups)) {
        return groups.flatMap((group, index) => nestConditionsAsAnd(group, branchNodesFor(index), currentScreenId, itemInfoMap));
    }
    return groups.reduceRight((elseBranch, group, index) => {
        const built = nestConditionsAsAnd(group, branchNodesFor(index), currentScreenId, itemInfoMap);
        return elseBranch ? [{ ...built[0], else: elseBranch }] : built;
    }, null);
};

const conditionKey = (condition) => `${condition.nodeId}|${condition.suffix ?? ''}|${condition.operator}|${condition.optionId}`;

const contradicts = (a, b) => a.nodeId === b.nodeId && (a.suffix ?? '') === (b.suffix ?? '')
    && (a.operator === b.operator ? a.operator === 'equals' && a.optionId !== b.optionId : a.optionId === b.optionId);

// Drops AND-groups that can never hold (e.g. tipo == A and tipo == B) and repeated conditions inside a group.
const normalizeGroups = (groups) => groups
    .filter((group) => !group.some((a, i) => group.some((b, j) => j > i && contradicts(a, b))))
    .map((group) => group.filter((condition, i) => group.findIndex((other) => conditionKey(other) === conditionKey(condition)) === i));

// Resolves a node's Visibility into hoisted "shared" conditions plus OR'd "innerGroups" (one named copy each).
// A condition on a source field that was itself duplicated by an OR is expanded into one clause per copy, each
// paired with the conditions that make that copy visible, since only the visible copy ever holds a value.
// Shared conditions are hoisted because WhatsApp Flow caps If nesting at 3 levels and each "else" level counts.
const planVisibility = (conditions, itemInfoMap, stack = []) => {
    const validConditions = (conditions ?? []).filter((condition) => condition.nodeId && condition.optionId && itemInfoMap.has(condition.nodeId));
    if (!validConditions.length) return null;

    const expand = (condition) => {
        const plain = [[{ ...condition, suffix: '' }]];
        if (stack.includes(condition.nodeId)) return plain;
        const sourcePlan = planVisibility(itemInfoMap.get(condition.nodeId).conditions, itemInfoMap, [...stack, condition.nodeId]);
        if (!sourcePlan || sourcePlan.innerGroups.length < 2) return plain;
        return sourcePlan.innerGroups.map((inner, index) => [
            ...sourcePlan.shared,
            ...inner,
            { ...condition, suffix: index ? `_or${index + 1}` : '' },
        ]);
    };

    const groups = normalizeGroups(groupConditionsByOr(validConditions, expand));
    if (!groups.length) return { shared: [], innerGroups: [] };
    const isShared = (condition) => groups.every((group) => group.some((other) => conditionKey(other) === conditionKey(condition)));
    const shared = groups[0].filter(isShared);
    const remainders = groups.map((group) => group.filter((condition) => !shared.some((other) => conditionKey(other) === conditionKey(condition))));
    // A branch left with nothing is always true once the shared part holds, so the other branches are redundant.
    return { shared, innerGroups: remainders.some((group) => !group.length) ? [[]] : remainders };
};

// Wraps a node (or node + its Top text) with every Visibility condition. Takes/returns an array so a
// Top text TextBody stays wrapped together with the field it belongs to.
const wrapWithVisibility = (nodes, conditions, currentScreenId, itemInfoMap) => {
    const plan = planVisibility(conditions, itemInfoMap);
    if (!plan) return nodes;
    if (!plan.innerGroups.length) return [];
    const inner = nestGroupsAsOr(plan.innerGroups, nodes, currentScreenId, itemInfoMap);
    return nestConditionsAsAnd(plan.shared, inner, currentScreenId, itemInfoMap);
};


// Each real (non-preview) node knows how to render its own WhatsApp Flow JSON via definition.toJson.
// A user-provided config.id overrides the auto-generated item.name as the payload/form field key.
// config.topText is rendered as a standalone TextBody right above the node, never shown in the designer's form.
const buildTopTextNode = (topText) => (
    { type: 'TextBody', ...textProps(topText) }
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
    .filter((node) => typeof node.name === 'string' && node.type !== NAV_MENU_WA_TYPE)
    .map((node) => ({
        key: payloadKey(screenName, node.name),
        formRef: `\${form.${node.name}}`,
        dataType: DATA_TYPE_BY_WA_TYPE[node.type] ?? 'string',
    }));

// A Nav Menu whose items each navigate forwards the clicked item's id as a field of its own.
const navMenuItemsOf = (screen) => screen.items.filter((item) => !item.isPreview && item.type === NAV_MENU_TYPE);
const navMenuField = (screen, item) => ({ key: payloadKey(screen.name, item.config?.id || item.name), dataType: 'string' });
const navMenuOwnFields = (screen) => navMenuItemsOf(screen)
    .filter((item) => item.config?.actionLevel !== 'component')
    .map((item) => navMenuField(screen, item));
const screenOwnFields = (screen, formChildren) => [...ownFieldsOf(formChildren, screen.name), ...navMenuOwnFields(screen)];

// Where a Nav Menu click navigates: its chosen main screen, or (when unset/invalid) the next screen in order.
const resolveNavTarget = (screenId, mainScreens, screenIndex, mainScreenIds, currentScreenId) => (
    screenId && screenId !== currentScreenId && mainScreenIds.has(screenId) ? screenId : mainScreens[screenIndex + 1]?.id
);

const navMenuTargets = (screen, mainScreens, screenIndex, mainScreenIds) => navMenuItemsOf(screen).flatMap((item) => {
    const config = item.config ?? {};
    const rawTargets = config.actionLevel === 'component' ? [config.screenId] : (config.items ?? []).map((entry) => entry.screenId);
    return rawTargets.map((targetId) => resolveNavTarget(targetId, mainScreens, screenIndex, mainScreenIds, screen.id));
}).filter(Boolean);

// Adds the on-click-action(s) to a Nav Menu node: at component level (one action for every item) or per item.
const applyNavMenuActions = (node, item, screen, mainScreens, screenIndex, mainScreenIds, forwardedEntries, incomingFieldsByScreenId) => {
    const config = item.config ?? {};
    const itemIds = navMenuItemIds(config.items);
    const ownField = navMenuField(screen, item);

    const buildAction = (rawTargetId, selection) => {
        const targetId = resolveNavTarget(rawTargetId, mainScreens, screenIndex, mainScreenIds, screen.id);
        if (!targetId) return null;
        const ownFields = selection === undefined ? [] : [{ key: ownField.key, formRef: selection }];
        const payload = buildPayload(ownFields, forwardedEntries, incomingFieldsByScreenId.get(targetId) ?? []);
        return { name: 'navigate', next: { name: targetId, type: 'screen' }, payload };
    };

    if (config.actionLevel === 'component') {
        const action = buildAction(config.screenId);
        return action ? { ...node, 'on-click-action': action } : node;
    }
    return {
        ...node,
        'list-items': node['list-items'].map((listItem, index) => {
            const action = buildAction(config.items?.[index]?.screenId, itemIds[index]);
            return action ? { ...listItem, 'on-click-action': action } : listItem;
        }),
    };
};

// The payload sent on navigate/complete: this screen's own answers, then everything forwarded from earlier screens.
// WhatsApp Flow requires a navigate payload to match the target screen's declared data model exactly, so when a
// screen is reachable through more than one path, allowedKeys narrows it down to that target's declared fields.
// Fields the target declares but this path never collected (e.g. a screen skipped by a Jump) are sent empty.
const emptyValueFor = (dataType) => {
    if (dataType === 'boolean') return false;
    if (dataType === 'array') return [];
    return '';
};

const buildPayload = (ownFields, forwardedEntries, allowedFields) => {
    const payload = {};
    const allowedKeys = allowedFields ? new Set(allowedFields.map((field) => field.key)) : null;
    const isAllowed = (key) => !allowedKeys || allowedKeys.has(key);
    ownFields.forEach(({ key, formRef }) => { if (isAllowed(key)) payload[key] = formRef; });
    forwardedEntries.forEach(({ key }) => { if (isAllowed(key)) payload[key] = `\${data.${key}}`; });
    allowedFields?.forEach(({ key, dataType }) => { if (!(key in payload)) payload[key] = emptyValueFor(dataType); });
    return payload;
};

const buildFooter = (screen, screens, screenIndex, ownFields, forwardedEntries, incomingFieldsByScreenId, targetScreenIdOverride) => {
    const targetScreenId = targetScreenIdOverride !== undefined ? targetScreenIdOverride : resolveFooterTarget(screen, screens, screenIndex);
    // No target (flow completion) means there's no screen data model to match: forward everything collected so far.
    const allowedFields = targetScreenId ? (incomingFieldsByScreenId.get(targetScreenId) ?? []) : null;
    const payload = buildPayload(ownFields, forwardedEntries, allowedFields);
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
    .filter((jump) => jump?.optionId && jump?.screenId && mainScreenIds.has(jump.screenId))
    .slice(0, MAX_JUMP_CONDITIONS);

// First item on the screen with at least one valid, resolvable jump condition, if any.
const findJumpItem = (screen, mainScreenIds) => screen.items.find((item) => (
    JUMP_NODE_TYPES.includes(item.type) && validJumpConditions(item, mainScreenIds).length > 0
));

// Builds the footer for a screen with jump conditions as a chain of "If"s nested through "else": each jump is
// "If <field> == '<option title>' then <Footer → target> else [next If]", ending with the default Footer.
// (Switch can't be used: its "cases" keys can't hold spaces/accents, and Meta rejects several sibling Footers.)
// WhatsApp Flow caps "If" nesting at 3 levels, so only the first MAX_JUMP_CONDITIONS jumps are emitted; the
// Jump to Screen editor enforces the same cap. Returns an array of nodes.
const buildFooterWithJump = (screen, screens, screenIndex, ownFields, forwardedEntries, jumpItem, incomingFieldsByScreenId, mainScreenIds) => {
    const fallbackFooter = buildFooter(screen, screens, screenIndex, ownFields, forwardedEntries, incomingFieldsByScreenId);
    const jumps = jumpItem ? validJumpConditions(jumpItem, mainScreenIds): [];
    if (!jumps.length) return [fallbackFooter];

    const reference = `\${form.${jumpItem.config?.id || jumpItem.name}}`;
    return jumps.reduceRight((elseBranch, jump) => [{
        type: 'If',
        condition: `${reference} == '${jump.optionId}'`,
        then: [buildFooter(screen, screens, screenIndex, ownFields, forwardedEntries, incomingFieldsByScreenId, jump.screenId)],
        else: elseBranch,
    }], [fallbackFooter]);
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
    const rawFormChildren = buildFormChildren(screen.items, screen.id, itemInfoMap);
    const navItems = navMenuItemsOf(screen);
    const isNavScreen = navItems.length > 0;
    let navIndex = 0;
    const formChildren = rawFormChildren.map((node) => (node.type === NAV_MENU_WA_TYPE
        ? applyNavMenuActions(node, navItems[navIndex++], screen, screens, screenIndex, mainScreenIds, forwardedEntries, incomingFieldsByScreenId)
        : node));
    const ownFields = screenOwnFields(screen, rawFormChildren);
    const jumpItem = findJumpItem(screen, mainScreenIds);
    // A Nav Menu screen navigates through its items: it has no Footer and is never terminal.
    const footer = isNavScreen ? [] : buildFooterWithJump(screen, screens, screenIndex, ownFields, forwardedEntries, jumpItem, incomingFieldsByScreenId, mainScreenIds);

    return {
        screen: {
            id: screen.id,
            title: screen.name,
            // An empty "data": {} (vs. omitting the key entirely) on a screen with nothing forwarded into it
            // appears to be what was crashing Meta's real validator, even though it looks harmless.
            ...(forwardedEntries.length ? { data: buildDataSchema(forwardedEntries) } : {}),
            ...(!isNavScreen && resolveFooterTarget(screen, screens, screenIndex) === undefined ? { terminal: true } : {}),
            layout: {
                type: 'SingleColumnLayout',
                // No "Form" wrapper: a conditional footer nested inside one appears to crash Meta's real
                // validator while building its routing graph, and fields bind by "name" either way.
                children: [...formChildren, ...footer],
            },
        },
        ownFields,
    };
};

// OptIn link targets have no Footer, aren't terminal, and don't need any forwarded data schema.
const buildLinkedScreen = (screen, itemInfoMap) => ({
    id: `${LINKED_SCREEN_ID_PREFIX}${screen.id}`,
    title: screen.name,
    layout: {
        type: 'SingleColumnLayout',
        children: buildFormChildren(screen.items, screen.id, itemInfoMap),
    },
});

// Every screen a jump/normal-next could lead to, used so WhatsApp Flow can validate non-linear navigation.
const screenSuccessors = (screen, screenIndex, mainScreens, mainScreenIds) => {
    if (navMenuItemsOf(screen).length) return [...new Set(navMenuTargets(screen, mainScreens, screenIndex, mainScreenIds))];
    const jumpItem = findJumpItem(screen, mainScreenIds);
    const jumpTargets = jumpItem ? validJumpConditions(jumpItem, mainScreenIds).map((jump) => jump.screenId) : [];
    const defaultTarget = resolveFooterTarget(screen, mainScreens, screenIndex);
    return [...new Set([...jumpTargets, defaultTarget].filter(Boolean))];
};

const buildRoutingModel = (mainScreens, mainScreenIds) => mainScreens.reduce((routingModel, screen, screenIndex) => {
    // Every main screen must appear as a key, even with an empty array (e.g. a terminal screen with no
    // outgoing target): omitting it appears to crash Meta's real validator while building the routing graph.
    routingModel[screen.id] = screenSuccessors(screen, screenIndex, mainScreens, mainScreenIds);
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

// A screen reachable through more than one path (e.g. a Jump that skips over another screen) declares the union
// of every path's fields, so no answer is lost before the final "complete" payload.
const unionFieldsByKey = (fieldSets) => {
    const byKey = new Map();
    fieldSets.flat().forEach((field) => { if (!byKey.has(field.key)) byKey.set(field.key, field); });
    return [...byKey.values()];
};

// Screens ordered so every screen comes after the ones that can navigate into it (reverse DFS post-order from
// the entry screen; a back edge in a loop is ignored). Array order alone isn't enough once screens can be
// rearranged, since an explicit footer/Jump target may point at a screen placed earlier than its source.
const topologicalScreenOrder = (mainScreens, mainScreenIds) => {
    const screenById = new Map(mainScreens.map((screen) => [screen.id, screen]));
    const visited = new Set();
    const postOrder = [];
    const visit = (screen, screenIndex) => {
        visited.add(screen.id);
        screenSuccessors(screen, screenIndex, mainScreens, mainScreenIds).forEach((targetId) => {
            if (!visited.has(targetId) && screenById.has(targetId)) visit(screenById.get(targetId), mainScreens.indexOf(screenById.get(targetId)));
        });
        postOrder.push(screen);
    };
    mainScreens.forEach((screen, screenIndex) => { if (!visited.has(screen.id)) visit(screen, screenIndex); });
    return postOrder.reverse();
};

// Builds the full WhatsApp Flow JSON document from the current screens/items state.
export const buildFlowJson = (rawScreens) => {
    const screens = migrateOptionIds(rawScreens);
    const linkedScreenIds = collectLinkedScreenIds(screens);
    const mainScreens = screens.filter((screen) => !linkedScreenIds.has(screen.id));
    const linkedScreens = screens.filter((screen) => linkedScreenIds.has(screen.id));
    // Screens that Jump/Nav Menu targets may point at. The entry (first) screen is excluded: Meta only accepts
    // an entry screen with no inbound edge, so a target pointing back at it is ignored.
    const mainScreenIds = new Set(mainScreens.slice(1).map((screen) => screen.id));
    const itemInfoMap = buildItemInfoMap(screens);
    const predecessorsByScreenId = buildPredecessorMap(mainScreens, mainScreenIds);

    // First pass: resolve every screen's declared (union of all paths) incoming fields before building any
    // footer, since a screen's payload must be filtered against the DECLARED data model of whatever it navigates to.
    const incomingFieldsByScreenId = new Map();
    const outgoingFieldsByScreenId = new Map();
    topologicalScreenOrder(mainScreens, mainScreenIds).forEach((screen) => {
        const predecessorIds = predecessorsByScreenId.get(screen.id) ?? [];
        const incomingFields = unionFieldsByKey(predecessorIds.map((id) => outgoingFieldsByScreenId.get(id) ?? []));
        const ownFields = screenOwnFields(screen, buildFormChildren(screen.items, screen.id, itemInfoMap));
        incomingFieldsByScreenId.set(screen.id, incomingFields);
        outgoingFieldsByScreenId.set(screen.id, [...incomingFields, ...ownFields]);
    });

    const builtMainScreens = mainScreens.map((screen, screenIndex) => {
        const forwardedEntries = incomingFieldsByScreenId.get(screen.id);
        return buildScreen(screen, mainScreens, screenIndex, forwardedEntries, mainScreenIds, itemInfoMap, incomingFieldsByScreenId).screen;
    });

    const builtLinkedScreens = linkedScreens.map((screen) => buildLinkedScreen(screen, itemInfoMap));
    const hasJumps = mainScreens.some((screen) => findJumpItem(screen, mainScreenIds) || navMenuItemsOf(screen).length);

    return {
        version: '7.3',
        ...(hasJumps ? { routing_model: buildRoutingModel(mainScreens, mainScreenIds) } : {}),
        screens: [...builtMainScreens, ...builtLinkedScreens],
    };
};

