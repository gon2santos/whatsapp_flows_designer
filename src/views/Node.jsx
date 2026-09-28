import '../assets/CSS/Node.css'

const Node = ({ title, children }) => {
    return (
        <div className="node-container">
            <div className="node-content">{children}</div>
            <p>{title}</p>
        </div>
    );
}

export default Node;