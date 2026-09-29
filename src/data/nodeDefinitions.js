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

// Single source of truth shared by the palette and the form, so dropped nodes render with the same icon/title.
// ConfigComponent is the per-type editor shown in the modal when a form node is double-clicked.
// defaultConfig seeds a new node's editable values; toJson(config, { name }) renders its WhatsApp Flow JSON node.
const nodeDefinitions = [
    {
        type: 'short-answer',
        title: 'Short Answer',
        Icon: ShortAnswer,
        ConfigComponent: ShortAnswerConfig,
        defaultConfig: { label: '', required: false },
        toJson: (config, { name }) => ({
            type: 'TextInput', 'input-type': 'text', label: labelField(config), name, required: !!config.required,
        }),
    },
    {
        type: 'paragraph-answer',
        title: 'Multi-line Answer',
        Icon: ParagraphAnswer,
        ConfigComponent: ParagraphAnswerConfig,
        defaultConfig: { label: '', required: false },
        toJson: (config, { name }) => ({
            type: 'TextArea', label: labelField(config), name, required: !!config.required,
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
