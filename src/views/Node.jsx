import '../assets/CSS/Node.css'

const NODE_GROUP_BY_TYPE = {
    'short-answer': 'input',
    'paragraph-answer': 'input',
    dropdown: 'select',
    radio: 'select',
    'multiple-choice': 'select',
    'nav-menu': 'select',
    'text-caption': 'text',
    'text-body': 'text',
    'text-small-heading': 'text',
    'text-large-heading': 'text',
};

const Node = ({ title, children, ref, details, type, ...rest }) => {
    const group = NODE_GROUP_BY_TYPE[type];
    return (
        <div className={`node-container${group ? ` node-container--${group}` : ''}${details ? ' node-container--expanded' : ''}`} ref={ref} {...rest}>
            <div className="node-content">{children}</div>
            <p>{title}</p>
            {details}
        </div>
    );
}

export default Node;