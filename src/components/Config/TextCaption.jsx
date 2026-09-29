import { useState } from 'react'

const TextCaption = () => {
    const [text, setText] = useState('');

    return (
        <div className="config-panel">
            <label>
                Text
                <input type="text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Caption text" />
            </label>
        </div>
    );
}

export default TextCaption;
