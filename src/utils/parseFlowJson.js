import nodeDefinitions from '../data/nodeDefinitions'
import { slugify } from './slugify'

// Mirrors buildFlowJson's LINKED_SCREEN_ID_PREFIX: screens only reachable via an OptIn's "Leer más" link.
const LINKED_SCREEN_ID_PREFIX = 'OPTIN_SCREEN_';
const isLinkedScreenId = (id) => typeof id === 'string' && id.startsWith(LINKED_SCREEN_ID_PREFIX);
const stripLinkedScreenId = (id) => (isLinkedScreenId(id) ? id.slice(LINKED_SCREEN_ID_PREFIX.length) : id);

// Reverse of each nodeDefinitions.toJson: WhatsApp Flow component type -> this app's internal node type.
const WA_TYPE_TO_INTERNAL = {
    TextInput: 'short-answer',
    TextArea: 'paragraph-answer',
    DatePicker: 'date-picker',
    Dropdown: 'dropdown',
    CheckboxGroup: 'multiple-choice',
    RadioButtonsGroup: 'radio',
    OptIn: 'opt-in',
    Image: 'image',
    TextCaption: 'text-caption',
    TextBody: 'text-body',
    TextSubheading: 'text-small-heading',
    TextHeading: 'text-large-heading',
};

// Node types whose config can hold "Top text" (a standalone TextBody rendered right above them by buildFlowJson).
const TOP_TEXT_ELIGIBLE_TYPES = ['short-answer', 'paragraph-answer', 'date-picker', 'dropdown', 'radio', 'multiple-choice'];

// Node types whose WhatsApp Flow JSON carries a "name", i.e. they can be a Visibility/Jump source or forwarded payload entry.
const NAMED_TYPES = ['short-answer', 'paragraph-answer', 'date-picker', 'dropdown', 'multiple-choice', 'radio', 'opt-in'];

const titleFor = (internalType) => nodeDefinitions.find((definition) => definition.type === internalType)?.title ?? internalType;

const createItem = (internalType, name, config) => ({
    id: crypto.randomUUID(),
    type: internalType,
    title: titleFor(internalType),
    name,
    config,
});

const screenSlug = (screenName) => screenName.replace(/\s+/g, '_');
const payloadKey = (screenName, fieldName) => `${screenSlug(screenName)}_${fieldName}`;

// Reverse of nodeDefinitions' toDataSource: the dummy single "Option" entry means the user hadn't typed any option yet.
const fromDataSource = (dataSource) => {
    if (!Array.isArray(dataSource) || dataSource.length === 0) return [''];
    if (dataSource.length === 1 && dataSource[0]?.id === '0_Option' && dataSource[0]?.title === 'Option') return [''];
    return dataSource.map((entry) => entry?.title ?? '');
};

// Reverse of nodeDefinitions' SHORT_ANSWER_WA_INPUT_TYPE/SHORT_ANSWER_PATTERN mapping.
const shortAnswerInputTypeFrom = (waInputType, pattern) => {
    if (pattern === '^[0-9]+$') return waInputType === 'password' ? 'passcode' : 'number';
    return waInputType ?? 'text';
};

// TextBody's text is a plain string, unless the source had markdown (then it's a single-entry array).
const textOf = (node) => (Array.isArray(node.text) ? node.text[0] ?? '' : node.text ?? '');

// Builds this item's editable config from its WhatsApp Flow node; returns null when the type is unsupported.
const configFromNode = (internalType, node) => {
    switch (internalType) {
        case 'short-answer':
            return {
                label: node.label ?? '', required: !!node.required,
                inputType: shortAnswerInputTypeFrom(node['input-type'], node.pattern),
                helperText: node['helper-text'] ?? '',
            };
        case 'paragraph-answer':
        case 'date-picker':
            return { label: node.label ?? '', required: !!node.required, helperText: node['helper-text'] ?? '' };
        case 'dropdown':
        case 'multiple-choice':
        case 'radio':
            return { label: node.label ?? '', required: !!node.required, options: fromDataSource(node['data-source']) };
        case 'opt-in':
            return {
                label: node.label ?? '', required: !!node.required,
                ...(node['on-click-action']?.next?.name ? { linkedScreenId: stripLinkedScreenId(node['on-click-action'].next.name) } : {}),
            };
        case 'image':
            return { src: node.src ?? '', mimeType: '', fileName: '', height: Number(node.height) || 200 };
        case 'text-caption':
        case 'text-body':
        case 'text-small-heading':
        case 'text-large-heading':
            return { text: textOf(node) };
        default:
            return null;
    }
};

// Matches the condition strings produced by buildFlowJson's wrapWithVisibility/buildFooterWithJump.
const CONDITION_PATTERN = /^\$\{(form|data)\.([A-Za-z0-9_]+)\}\s*(==|!=)\s*'([\s\S]*)'$/;

const parseCondition = (conditionString, screenId, nameToItemId, payloadKeyToItemId) => {
    const match = CONDITION_PATTERN.exec(conditionString ?? '');
    if (!match) return null;
    const [, scope, ref, operator, optionId] = match;
    const nodeId = scope === 'form' ? nameToItemId.get(`${screenId}:${ref}`) : payloadKeyToItemId.get(ref);
    if (!nodeId) return null;
    return { nodeId, operator: operator === '!=' ? 'not-equals' : 'equals', optionId };
};

// Peels off nested "If" wrappers used for Visibility conditions (single-branch: "then" only, no "else"),
// collecting conditions outermost-first to match how wrapWithVisibility nests them.
const unwrapVisibility = (node, screenId, nameToItemId, payloadKeyToItemId) => {
    const visibilityConditions = [];
    let current = node;
    while (current?.type === 'If' && Array.isArray(current.then) && current.then.length === 1 && !current.else) {
        const condition = parseCondition(current.condition, screenId, nameToItemId, payloadKeyToItemId);
        if (!condition) break;
        visibilityConditions.push(condition);
        current = current.then[0];
    }
    return { node: current, visibilityConditions };
};

const FOOTER_TYPE = 'Footer';

// Pulls the footer out of a screen's form children, unwrapping the "If" added for a Jump-to-Screen condition, if any.
const extractFooterInfo = (formChildren, screenId, nameToItemId, payloadKeyToItemId) => {
    const last = formChildren[formChildren.length - 1];
    if (!last) return null;

    if (last.type === 'If' && last.then?.[0]?.type === FOOTER_TYPE && last.else?.[0]?.type === FOOTER_TYPE) {
        const condition = parseCondition(last.condition, screenId, nameToItemId, payloadKeyToItemId);
        const jumpTargetName = last.then[0]['on-click-action']?.next?.name;
        return {
            footer: last.else[0],
            jump: condition && jumpTargetName ? { ...condition, screenId: stripLinkedScreenId(jumpTargetName) } : null,
        };
    }
    if (last.type === FOOTER_TYPE) return { footer: last, jump: null };
    return null;
};

// Converts a screen's Form children (everything but the Footer) into this app's node items, registering each
// named node so later conditions (same-screen "form." or forwarded "data.") can resolve back to it by id.
const buildScreenItems = (children, screenId, screenName, nameToItemId, payloadKeyToItemId) => {
    const items = [];
    let pendingTopText = null;

    const flushPendingTopText = () => {
        if (!pendingTopText) return;
        items.push(createItem('text-body', `text_${items.length}`, { text: textOf(pendingTopText) }));
        pendingTopText = null;
    };

    children.forEach((child) => {
        const { node, visibilityConditions } = unwrapVisibility(child, screenId, nameToItemId, payloadKeyToItemId);
        if (!node) { flushPendingTopText(); return; }

        // A bare TextBody might just be the "Top text" of the node right after it: hold onto it until we know.
        if (node.type === 'TextBody' && visibilityConditions.length === 0) {
            flushPendingTopText();
            pendingTopText = node;
            return;
        }

        const internalType = WA_TYPE_TO_INTERNAL[node.type];
        const config = internalType ? configFromNode(internalType, node) : null;
        if (!internalType || !config) {
            flushPendingTopText();
            return;
        }

        if (pendingTopText && TOP_TEXT_ELIGIBLE_TYPES.includes(internalType)) {
            config.topText = textOf(pendingTopText);
            pendingTopText = null;
        } else {
            flushPendingTopText();
        }

        if (visibilityConditions.length) config.visibilityConditions = visibilityConditions;

        const fieldName = typeof node.name === 'string' && node.name ? node.name : `${slugify(internalType)}_${items.length}`;
        // The modal's "Id" field reads config.id, so the imported field name must land there too, not just in item.name.
        if (NAMED_TYPES.includes(internalType)) config.id = fieldName;
        const item = createItem(internalType, fieldName, config);
        items.push(item);

        if (NAMED_TYPES.includes(internalType)) {
            nameToItemId.set(`${screenId}:${fieldName}`, item.id);
            payloadKeyToItemId.set(payloadKey(screenName, fieldName), item.id);
        }
    });

    flushPendingTopText();
    return items;
};

// Parses a pasted WhatsApp Flow JSON document back into this app's screens/items state.
// Throws a descriptive Error when the document's shape can't be recognized at all.
export const parseFlowJson = (flow) => {
    if (!flow || typeof flow !== 'object' || Array.isArray(flow)) {
        throw new Error('El JSON debe ser un objeto con una propiedad "screens".');
    }
    if (!Array.isArray(flow.screens) || flow.screens.length === 0) {
        throw new Error('El JSON debe incluir al menos una pantalla en "screens".');
    }

    const nameToItemId = new Map();
    const payloadKeyToItemId = new Map();

    const buildScreen = (rawScreen, internalId) => {
        if (!rawScreen || typeof rawScreen.id !== 'string' || !rawScreen.id) {
            throw new Error('Cada pantalla debe tener un "id" válido.');
        }
        const screenName = rawScreen.title || internalId;
        const formNode = (rawScreen.layout?.children ?? []).find((child) => child?.type === 'Form');
        const formChildren = Array.isArray(formNode?.children) ? formNode.children : [];

        // Footer-shaped entries have no matching WA_TYPE_TO_INTERNAL mapping, so this naturally skips them;
        // items must be built (and registered) first so a same-screen Jump condition below can resolve by name.
        const items = buildScreenItems(formChildren, internalId, screenName, nameToItemId, payloadKeyToItemId);
        const footerInfo = extractFooterInfo(formChildren, internalId, nameToItemId, payloadKeyToItemId);

        if (footerInfo?.jump) {
            const jumpItem = items.find((item) => item.id === footerInfo.jump.nodeId);
            if (jumpItem) jumpItem.config.jumpCondition = { optionId: footerInfo.jump.optionId, screenId: footerInfo.jump.screenId };
        }

        const hasNext = !!footerInfo?.footer?.['on-click-action']?.next;
        const defaultLabel = hasNext ? 'Continuar' : 'Finalizar';
        const footerLabel = footerInfo?.footer?.label && footerInfo.footer.label !== defaultLabel ? footerInfo.footer.label : null;

        return { id: internalId, name: screenName, items, footerLabel };
    };

    const rawMainScreens = flow.screens.filter((screen) => !isLinkedScreenId(screen?.id));
    const rawLinkedScreens = flow.screens.filter((screen) => isLinkedScreenId(screen?.id));

    const mainScreens = rawMainScreens.map((rawScreen) => buildScreen(rawScreen, rawScreen.id));
    const linkedScreens = rawLinkedScreens.map((rawScreen) => buildScreen(rawScreen, stripLinkedScreenId(rawScreen.id)));

    return [...mainScreens, ...linkedScreens];
};
