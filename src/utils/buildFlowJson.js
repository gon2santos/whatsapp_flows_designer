import nodeDefinitions from '../data/nodeDefinitions'

const findDefinition = (type) => nodeDefinitions.find((definition) => definition.type === type);

// Each real (non-preview) node knows how to render its own WhatsApp Flow JSON via definition.toJson.
// A user-provided config.id overrides the auto-generated item.name as the payload/form field key.
const buildFormChildren = (items) => items
    .filter((item) => !item.isPreview)
    .map((item) => findDefinition(item.type)?.toJson(item.config ?? {}, { name: item.config?.id || item.name }))
    .filter(Boolean);

// Payload key used to carry a screen's answer forward through the navigate/complete chain.
const screenSlug = (screenName) => screenName.replace(/\s+/g, '_');
const payloadKey = (screenName, fieldName) => `${screenSlug(screenName)}_${fieldName}`;

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

// Only nodes with a "name" (TextInput, Dropdown, DatePicker, etc.) hold a user answer worth forwarding.
const ownFieldsOf = (formChildren, screenName) => formChildren
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

const buildFooter = (screens, screenIndex, ownFields, forwardedEntries) => {
    const nextScreen = screens[screenIndex + 1];
    const payload = buildPayload(ownFields, forwardedEntries);
    return {
        type: 'Footer',
        label: 'Continue',
        'on-click-action': nextScreen
            ? { name: 'navigate', next: { name: nextScreen.id, type: 'screen' }, payload }
            : { name: 'complete', payload },
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

const buildScreen = (screen, screens, screenIndex, forwardedEntries) => {
    const formChildren = buildFormChildren(screen.items);
    const ownFields = ownFieldsOf(formChildren, screen.name);
    const footer = buildFooter(screens, screenIndex, ownFields, forwardedEntries);

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

// Builds the full WhatsApp Flow JSON document from the current screens/items state.
export const buildFlowJson = (screens) => {
    let forwardedEntries = [];

    const builtScreens = screens.map((screen, screenIndex) => {
        const { screen: builtScreen, ownFields } = buildScreen(screen, screens, screenIndex, forwardedEntries);
        // Everything this screen owns gets carried forward to every screen after it.
        forwardedEntries = [...forwardedEntries, ...ownFields];
        return builtScreen;
    });

    return { version: '7.3', screens: builtScreens };
};
