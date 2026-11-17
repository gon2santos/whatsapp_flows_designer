import '../../assets/CSS/Palette.css'
import PaletteNode from '../../components/PaletteNode'
import nodeDefinitions from '../../data/nodeDefinitions'

const PALETTE_ORDER = [
    'short-answer', 'paragraph-answer', 'dropdown', 'radio', 'multiple-choice', 'nav-menu',
    'date-picker', 'image', 'opt-in', 'text-large-heading', 'text-small-heading', 'text-body', 'text-caption',
];
const orderIndex = (type) => {
    const index = PALETTE_ORDER.indexOf(type);
    return index === -1 ? PALETTE_ORDER.length : index;
};
const paletteDefinitions = [...nodeDefinitions].sort((a, b) => orderIndex(a.type) - orderIndex(b.type));

function PaletteContainer() {
    return (
        <div className="palette-container">
            {paletteDefinitions.map((definition) => (
                <PaletteNode key={definition.type} definition={definition} />
            ))}
        </div>
    )
}

export default PaletteContainer;
