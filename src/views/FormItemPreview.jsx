import Node from './Node'
import nodeDefinitions from '../data/nodeDefinitions'

// Static placeholder shown while a palette node is dragged over the form, indicating where it will land.
const FormItemPreview = ({ type, title }) => {
    const definition = nodeDefinitions.find((item) => item.type === type);

    return (
        <div className="form-item-preview">
            <Node title={title}>
                {definition && <definition.Icon />}
            </Node>
        </div>
    );
}

export default FormItemPreview;
