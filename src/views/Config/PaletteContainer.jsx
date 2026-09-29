import '../../assets/CSS/Palette.css'
import PaletteNode from '../../components/PaletteNode'
import nodeDefinitions from '../../data/nodeDefinitions'

function PaletteContainer() {
    return (
        <div className="palette-container">
            {nodeDefinitions.map((definition) => (
                <PaletteNode key={definition.type} definition={definition} />
            ))}
        </div>
    )
}

export default PaletteContainer;
