import '../assets/CSS/Node.css'

const Node = ({ title, children, ref, details, ...rest }) => {
    return (
        <div className={`node-container${details ? ' node-container--expanded' : ''}`} ref={ref} {...rest}>
            <div className="node-content">{children}</div>
            <p>{title}</p>
            {details}
        </div>
    );
}

export default Node;