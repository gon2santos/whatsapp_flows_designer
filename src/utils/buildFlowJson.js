import nodeDefinitions from '../data/nodeDefinitions'

const findDefinition = (type) => nodeDefinitions.find((definition) => definition.type === type);

// Each real (non-preview) node knows how to render its own WhatsApp Flow JSON via definition.toJson.
const buildFormChildren = (items) => items
    .filter((item) => !item.isPreview)
    .map((item) => findDefinition(item.type)?.toJson(item.config ?? {}, { name: item.name }))
    .filter(Boolean);

// Payload key used to carry a screen's answer forward through the navigate/complete chain.
const payloadKey = (screenIndex, fieldName) => `screen_${screenIndex}_${fieldName}`;

// Only nodes with a "name" (TextInput, Dropdown, DatePicker, etc.) hold a user answer worth forwarding.
const ownFieldsOf = (formChildren, screenIndex) => formChildren
    .filter((node) => typeof node.name === 'string')
    .map((node) => ({ key: payloadKey(screenIndex, node.name), formRef: `\${form.${node.name}}` }));

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
const buildDataSchema = (forwardedEntries) => forwardedEntries.reduce((schema, { key }) => {
    schema[key] = { '__example__': 'Example', type: 'string' };
    return schema;
}, {});

const buildScreen = (screen, screens, screenIndex, forwardedEntries) => {
    const formChildren = buildFormChildren(screen.items);
    const ownFields = ownFieldsOf(formChildren, screenIndex);
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
