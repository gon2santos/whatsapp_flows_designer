import { useState } from 'react'

const TextLargeHeading = () => {
    const [text, setText] = useState('');

    return (
        <div className="config-panel">
            <label>
                Heading
                <input type="text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Large heading" />
            </label>
        </div>
    );
}

export default TextLargeHeading;
