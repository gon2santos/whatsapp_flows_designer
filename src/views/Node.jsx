import '../assets/CSS/Node.css'

const Node = ({ title, children, ref, ...rest }) => {
    return (
        <div className="node-container" ref={ref} {...rest}>
            <div className="node-content">{children}</div>
            <p>{title}</p>
        </div>
    );
}

export default Node;