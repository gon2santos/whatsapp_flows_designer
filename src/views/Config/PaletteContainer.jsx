import '../../assets/CSS/Palette.css'
import DatePicker from '../../components/Palette/DatePicker'
import Dropdown from '../../components/Palette/Dropdown'
import ShortAnswer from '../../components/Palette/ShortAnswer'
import TextBody from '../../components/Palette/TextBody'
import TextCaption from '../../components/Palette/TextCaption'
import LargeTextHeading from '../../components/Palette/TextLargeHeading'
import SmallTextHeading from '../../components/Palette/TextSmallheading'
import Image from '../../components/Palette/Image'
import Radio from '../../components/Palette/Radio'
import OptIn from '../../components/Palette/OptIn'
import MultipleChoice from '../../components/Palette/MultipleChoice'
import ParagraphAnswer from '../../components/Palette/ParagraphAnswer'
import Node from '../../views/Node'

function PaletteContainer() {
    return (
        <div className="palette-container">
            <Node title="Date Picker">
                <DatePicker />
            </Node>
            <Node title="Dropdown">
                <Dropdown />
            </Node>
            <Node title="Short Answer">
                <ShortAnswer />
            </Node>
            <Node title="Text Body">
                <TextBody />
            </Node>
            <Node title="Text Caption">
                <TextCaption />
            </Node>
            <Node title="Large Text Heading">
                <LargeTextHeading />
            </Node>
            <Node title="Small Text Heading">
                <SmallTextHeading />
            </Node>
            <Node title="Image">
                <Image />
            </Node>
            <Node title="Radio">
                <Radio />
            </Node>
            <Node title="OptIn">
                <OptIn />
            </Node>
            <Node title="Multiple Choice">
                <MultipleChoice />
            </Node>
            <Node title="Paragraph Answer">
                <ParagraphAnswer />
            </Node>
        </div>
    )
}

export default PaletteContainer;
