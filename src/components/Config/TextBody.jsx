import { useState } from 'react'

const TextBody = () => {
    const [text, setText] = useState('');

    return (
        <div className="config-panel">
            <label>
                Text
                <textarea rows={4} value={text} onChange={(event) => setText(event.target.value)} placeholder="Body text" />
            </label>
        </div>
    );
}

export default TextBody;
