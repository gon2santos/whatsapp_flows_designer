import { buildFlowJson } from './buildFlowJson'

// Layout constants mirroring the bot tool's canvas: variable nodes sit in a 3-column grid inside a context group.
const COLUMNS = 3;
const ORIGIN = { x: 594, y: 1911.2107 };
const CELL = { width: 131, height: 41 };
const DECISION = { x: 960.5, gapAfterGrid: 140, step: 341.3714 };
const MERGE_CONTEXT = { x: 800, offsetFromDecision: 182.6108 };

// Trailing "_0", "_1"... or "_or2", "_or3"... mark a field duplicated by a Visibility OR branch or a repeated block.
const DUPLICATE_SUFFIX = /^(.+?)_(?:or)?\d+$/;

const round = (value) => Number(value.toFixed(4));
const loc = (x, y) => `${round(x)} ${round(y)}`;

const collectCompletePayloadKeys = (node, keys = new Set()) => {
    if (Array.isArray(node)) {
        node.forEach((child) => collectCompletePayloadKeys(child, keys));
    } else if (node && typeof node === 'object') {
        if (node.name === 'complete' && node.payload) Object.keys(node.payload).forEach((key) => keys.add(key));
        Object.values(node).forEach((child) => collectCompletePayloadKeys(child, keys));
    }
    return keys;
};

// Payload keys are "<ScreenName>_<field>"; the bot variable is just the field, so the longest matching screen prefix is dropped.
const toVariableName = (payloadKey, screenSlugs) => {
    const prefix = screenSlugs
        .filter((slug) => payloadKey.startsWith(`${slug}_`))
        .sort((a, b) => b.length - a.length)[0];
    return prefix ? payloadKey.slice(prefix.length + 1) : payloadKey;
};

const contextNode = (key, text, centerLoc, { isMain }) => ({
    category: 'context',
    text,
    isGroup: true,
    key,
    intentname: 'To Be Defined',
    message: '',
    allow_skip_context: isMain,
    force_stop: false,
    debug: false,
    use_pipeline: isMain,
    allow_node_execution: isMain,
    disable_feedback: false,
    figure: 'RoundedRectangle',
    keyword: '',
    fill: '#e8e8e8',
    use_context_response: false,
    enable_suggestion: isMain,
    loc: centerLoc,
    stroke_shape: 'black',
    is_end_node: false,
    has_warnings: false,
    warnings: [],
});

const varNode = (key, name, value, nodeLoc, group) => ({
    category: 'var_node',
    var_name: name,
    var_value: value,
    var_operation: 'set',
    key,
    loc: nodeLoc,
    group,
});

// Builds the partial node list (without surrounding brackets) the bot-creation tool expects for the flow's "complete" payloads.
export const buildBotVariablesJson = (screens) => {
    const payloadKeys = [...collectCompletePayloadKeys(buildFlowJson(screens))];
    if (!payloadKeys.length) return '';

    const screenSlugs = screens.map((screen) => screen.name.replace(/\s+/g, '_'));
    let nextKey = -1;
    const takeKey = () => nextKey--;

    const groupKey = takeKey();
    const variableNames = payloadKeys.map((payloadKey) => toVariableName(payloadKey, screenSlugs));
    const rows = Math.ceil(payloadKeys.length / COLUMNS);
    const columnsUsed = Math.min(payloadKeys.length, COLUMNS);

    const capturedNodes = payloadKeys.map((payloadKey, index) => varNode(
        takeKey(),
        variableNames[index],
        `[$${payloadKey}$]`,
        loc(ORIGIN.x + (index % COLUMNS) * CELL.width, ORIGIN.y + Math.floor(index / COLUMNS) * CELL.height),
        groupKey,
    ));

    const gridCenter = loc(
        ORIGIN.x + ((columnsUsed - 1) * CELL.width) / 2,
        ORIGIN.y + ((rows - 1) * CELL.height) / 2,
    );
    const nodes = [contextNode(groupKey, 'capturar variables flow', gridCenter, { isMain: true }), ...capturedNodes];

    let decisionY = ORIGIN.y + (rows - 1) * CELL.height + DECISION.gapAfterGrid;
    variableNames.forEach((name) => {
        const baseName = name.match(DUPLICATE_SUFFIX)?.[1];
        if (!baseName) return;

        const mergeY = decisionY + MERGE_CONTEXT.offsetFromDecision;
        const mergeGroupKey = takeKey();
        const mergeLoc = loc(MERGE_CONTEXT.x, mergeY);
        nodes.push(
            {
                category: 'decision_node',
                text: 'IF',
                parametertoeval: name,
                conditiontype: 'notequal',
                valuetoeval: '',
                count_is_false: false,
                key: takeKey(),
                loc: loc(DECISION.x, decisionY),
            },
            contextNode(mergeGroupKey, `merge ${name}`, mergeLoc, { isMain: false }),
            varNode(takeKey(), baseName, `[[${name}]]`, mergeLoc, mergeGroupKey),
        );
        decisionY += DECISION.step;
    });

    return nodes.map((node) => JSON.stringify(node, null, 2)).join(',\n');
};
