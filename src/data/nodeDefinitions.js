import DatePicker from '../components/Palette/DatePicker'
import Dropdown from '../components/Palette/Dropdown'
import ShortAnswer from '../components/Palette/ShortAnswer'
import TextBody from '../components/Palette/TextBody'
import TextCaption from '../components/Palette/TextCaption'
import LargeTextHeading from '../components/Palette/TextLargeHeading'
import SmallTextHeading from '../components/Palette/TextSmallheading'
import Image from '../components/Palette/Image'
import Radio from '../components/Palette/Radio'
import OptIn from '../components/Palette/OptIn'
import MultipleChoice from '../components/Palette/MultipleChoice'
import ParagraphAnswer from '../components/Palette/ParagraphAnswer'

import DatePickerConfig from '../components/Config/DatePicker'
import DropdownConfig from '../components/Config/DropdownOption'
import ShortAnswerConfig from '../components/Config/ShortAnswer'
import TextBodyConfig from '../components/Config/TextBody'
import TextCaptionConfig from '../components/Config/TextCaption'
import LargeTextHeadingConfig from '../components/Config/TextLargeHeading'
import SmallTextHeadingConfig from '../components/Config/TextSmallheading'
import ImageConfig from '../components/Config/Image'
import RadioConfig from '../components/Config/RadioOption'
import OptInConfig from '../components/Config/OptIn'
import MultipleChoiceConfig from '../components/Config/MultipleChoiceOption'
import ParagraphAnswerConfig from '../components/Config/ParagraphAnswer'

// Turns the option list from OptionsField into WhatsApp Flow's "data-source" entries.
const toDataSource = (options = []) => options
    .map((option) => option.trim())
    .filter(Boolean)
    .map((option, index) => ({ id: `${index}_${option.replace(/\s+/g, '_')}`, title: option }));

const textField = (config) => config.text || 'Text';
const labelField = (config) => config.label || 'Label';

// Helper text shown per short-answer input type, matching WhatsApp Flow's own component library samples.
const SHORT_ANSWER_HELPER_TEXT = {
    text: 'Por favor ingrese los datos solicitados',
    password: 'must be at least 16 characters long',
    email: 'Por favor ingrese un email valido',
    number: 'Por favor ingrese solo números',
    passcode: 'Please enter your numeric passcode',
    phone: 'Por favor ingrese su número telefónico',
};

// WhatsApp Flow has no "number"/"passcode" input-type: both render as "text"/"password" with a digits-only pattern.
const SHORT_ANSWER_WA_INPUT_TYPE = { number: 'text', passcode: 'password' };
const SHORT_ANSWER_PATTERN = { number: '^[0-9]+$', passcode: '^[0-9]+$' };


// Single source of truth shared by the palette and the form, so dropped nodes render with the same icon/title.
// ConfigComponent is the per-type editor shown in the modal when a form node is double-clicked.
// defaultConfig seeds a new node's editable values; toJson(config, { name }) renders its WhatsApp Flow JSON node.
const nodeDefinitions = [
    {
        type: 'short-answer',
        title: 'Short Answer',
        Icon: ShortAnswer,
        ConfigComponent: ShortAnswerConfig,
        defaultConfig: { label: '', required: false, inputType: 'text' },
        toJson: (config, { name }) => {
            const inputType = config.inputType || 'text';
            const pattern = SHORT_ANSWER_PATTERN[inputType];
            return {
                type: 'TextInput', 'input-type': SHORT_ANSWER_WA_INPUT_TYPE[inputType] ?? inputType, label: labelField(config), name, required: !!config.required,
                'helper-text': config.helperText || SHORT_ANSWER_HELPER_TEXT[inputType] || SHORT_ANSWER_HELPER_TEXT.text,
                ...(pattern ? { pattern } : {}),
            };
        },
    },
    {
        type: 'paragraph-answer',
        title: 'Multi-line Answer',
        Icon: ParagraphAnswer,
        ConfigComponent: ParagraphAnswerConfig,
        defaultConfig: { label: '', required: false },
        toJson: (config, { name }) => ({
            type: 'TextArea', label: labelField(config), name, required: !!config.required,
            ...(config.helperText ? { 'helper-text': config.helperText } : {}),
        }),
    },
    {
        type: 'date-picker',
        title: 'Date Picker',
        Icon: DatePicker,
        ConfigComponent: DatePickerConfig,
        defaultConfig: { label: '', required: false },
        toJson: (config, { name }) => ({
            type: 'DatePicker', label: labelField(config), name, required: !!config.required,
            ...(config.helperText ? { 'helper-text': config.helperText } : {}),
        }),
    },
    {
        type: 'dropdown',
        title: 'Dropdown',
        Icon: Dropdown,
        ConfigComponent: DropdownConfig,
        defaultConfig: { label: '', required: false, options: [''] },
        toJson: (config, { name }) => ({
            type: 'Dropdown', label: labelField(config), name, required: !!config.required, 'data-source': toDataSource(config.options),
        }),
    },
    {
        type: 'multiple-choice',
        title: 'Multiple Choice',
        Icon: MultipleChoice,
        ConfigComponent: MultipleChoiceConfig,
        defaultConfig: { label: '', required: false, options: [''] },
        toJson: (config, { name }) => ({
            type: 'CheckboxGroup', label: labelField(config), name, required: !!config.required, 'data-source': toDataSource(config.options),
        }),
    },
    {
        type: 'radio',
        title: 'Radio',
        Icon: Radio,
        ConfigComponent: RadioConfig,
        defaultConfig: { label: '', required: false, options: [''] },
        toJson: (config, { name }) => ({
            type: 'RadioButtonsGroup', label: labelField(config), name, required: !!config.required, 'data-source': toDataSource(config.options),
        }),
    },
    {
        type: 'opt-in',
        title: 'OptIn',
        Icon: OptIn,
        ConfigComponent: OptInConfig,
        defaultConfig: { label: '', required: false },
        toJson: (config, { name }) => ({
            type: 'OptIn', label: labelField(config), name, required: !!config.required,
        }),
    },
    {
        type: 'image',
        title: 'Image',
        Icon: Image,
        ConfigComponent: ImageConfig,
        defaultConfig: { src: '', altText: '' },
        toJson: (config) => ({
            type: 'Image', src: config.src || '', 'scale-type': 'contain', height: 200,
            ...(config.altText ? { 'alt-text': config.altText } : {}),
        }),
    },
    {
        type: 'text-caption',
        title: 'Text Caption',
        Icon: TextCaption,
        ConfigComponent: TextCaptionConfig,
        defaultConfig: { text: '' },
        toJson: (config) => ({ type: 'TextCaption', text: textField(config) }),
    },
    {
        type: 'text-body',
        title: 'Text Body',
        Icon: TextBody,
        ConfigComponent: TextBodyConfig,
        defaultConfig: { text: '' },
        toJson: (config) => ({ type: 'TextBody', text: textField(config) }),
    },
    {
        type: 'text-small-heading',
        title: 'Small Header',
        Icon: SmallTextHeading,
        ConfigComponent: SmallTextHeadingConfig,
        defaultConfig: { text: '' },
        toJson: (config) => ({ type: 'TextSubheading', text: textField(config) }),
    },
    {
        type: 'text-large-heading',
        title: 'Large Header',
        Icon: LargeTextHeading,
        ConfigComponent: LargeTextHeadingConfig,
        defaultConfig: { text: '' },
        toJson: (config) => ({ type: 'TextHeading', text: textField(config) }),
    },
];

export default nodeDefinitions;
