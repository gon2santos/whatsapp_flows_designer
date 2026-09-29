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

// Single source of truth shared by the palette and the form, so dropped nodes render with the same icon/title.
const nodeDefinitions = [
    { type: 'date-picker', title: 'Date Picker', Icon: DatePicker },
    { type: 'dropdown', title: 'Dropdown', Icon: Dropdown },
    { type: 'short-answer', title: 'Short Answer', Icon: ShortAnswer },
    { type: 'text-body', title: 'Text Body', Icon: TextBody },
    { type: 'text-caption', title: 'Text Caption', Icon: TextCaption },
    { type: 'text-large-heading', title: 'Large Text Heading', Icon: LargeTextHeading },
    { type: 'text-small-heading', title: 'Small Text Heading', Icon: SmallTextHeading },
    { type: 'image', title: 'Image', Icon: Image },
    { type: 'radio', title: 'Radio', Icon: Radio },
    { type: 'opt-in', title: 'OptIn', Icon: OptIn },
    { type: 'multiple-choice', title: 'Multiple Choice', Icon: MultipleChoice },
    { type: 'paragraph-answer', title: 'Paragraph Answer', Icon: ParagraphAnswer },
];

export default nodeDefinitions;
