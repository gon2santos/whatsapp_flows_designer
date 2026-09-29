import { useState } from 'react'

const Image = () => {
    const [src, setSrc] = useState('');
    const [altText, setAltText] = useState('');

    return (
        <div className="config-panel">
            <label>
                Image URL
                <input type="text" value={src} onChange={(event) => setSrc(event.target.value)} placeholder="https://..." />
            </label>
            <label>
                Alt text
                <input type="text" value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Describe the image" />
            </label>
        </div>
    );
}

export default Image;
