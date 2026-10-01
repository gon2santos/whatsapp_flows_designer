import { useRef, useState } from 'react';

const MAX_FILE_SIZE = 300 * 1024; // 300kb
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const Image = ({ config, onChange }) => {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');

    const processFile = async (file) => {
        if (!file) return;
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setError('Acceptable file types: JPEG, PNG');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setError('Maximum file size: 300kb');
            return;
        }
        setError('');
        const dataUrl = await readFileAsDataUrl(file);
        const base64 = dataUrl.split(',')[1] ?? '';
        onChange({ ...config, src: base64, mimeType: file.type, fileName: file.name });
    };

    const handleInputChange = (event) => {
        processFile(event.target.files?.[0]);
        event.target.value = '';
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        processFile(event.dataTransfer.files?.[0]);
    };

    const handleRemove = (event) => {
        event.stopPropagation();
        setError('');
        onChange({ ...config, src: '', mimeType: '', fileName: '' });
    };

    // Rebuilds the data URL for the preview; only the raw base64 is kept in the JSON output.
    const previewSrc = config.src ? `data:${config.mimeType || 'image/png'};base64,${config.src}` : '';

    return (
        <div className="config-panel">
            <div
                className={`image-dropzone${isDragging ? ' image-dropzone--active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                {previewSrc ? (
                    <>
                        <img src={previewSrc} alt={config.fileName || 'Selected image'} className="image-dropzone-preview" />
                        <button type="button" className="image-dropzone-remove" onClick={handleRemove}>Remove image</button>
                    </>
                ) : (
                    <span>Drag & drop an image here, or click to select one</span>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleInputChange}
                    hidden
                />
            </div>
            {error && <p className="image-dropzone-error">{error}</p>}
            <p className="image-dropzone-hint">Maximum file size: 300kb<br />Acceptable file types: JPEG, PNG</p>
            <label>
                Image height
                <input
                    type="number"
                    value={config.height ?? ''}
                    onChange={(event) => onChange({ ...config, height: event.target.value })}
                    placeholder="200"
                />
            </label>
        </div>
    );
}

export default Image;
