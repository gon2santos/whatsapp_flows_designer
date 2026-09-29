import { useState } from 'react'

const TextSmallheading = () => {
    const [text, setText] = useState('');

    return (
        <div className="config-panel">
            <label>
                Subheading
                <input type="text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Small heading" />
            </label>
        </div>
    );
}

export default TextSmallheading;
