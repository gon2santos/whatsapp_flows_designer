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

// Single source of truth shared by the palette and the form, so dropped nodes render with the same icon/title.
// ConfigComponent is the per-type editor shown in the modal when a form node is double-clicked.
const nodeDefinitions = [
    { type: 'short-answer', title: 'Short Answer', Icon: ShortAnswer, ConfigComponent: ShortAnswerConfig },
    { type: 'paragraph-answer', title: 'Multi-line Answer', Icon: ParagraphAnswer, ConfigComponent: ParagraphAnswerConfig },
    { type: 'date-picker', title: 'Date Picker', Icon: DatePicker, ConfigComponent: DatePickerConfig },
    { type: 'dropdown', title: 'Dropdown', Icon: Dropdown, ConfigComponent: DropdownConfig },
    { type: 'multiple-choice', title: 'Multiple Choice', Icon: MultipleChoice, ConfigComponent: MultipleChoiceConfig },
    { type: 'radio', title: 'Radio', Icon: Radio, ConfigComponent: RadioConfig },
    { type: 'opt-in', title: 'OptIn', Icon: OptIn, ConfigComponent: OptInConfig },
    { type: 'image', title: 'Image', Icon: Image, ConfigComponent: ImageConfig },
    { type: 'text-caption', title: 'Text Caption', Icon: TextCaption, ConfigComponent: TextCaptionConfig },
    { type: 'text-body', title: 'Text Body', Icon: TextBody, ConfigComponent: TextBodyConfig },
    { type: 'text-small-heading', title: 'Small Header', Icon: SmallTextHeading, ConfigComponent: SmallTextHeadingConfig },
    { type: 'text-large-heading', title: 'Large Header', Icon: LargeTextHeading, ConfigComponent: LargeTextHeadingConfig },
];

export default nodeDefinitions;
