import { useEffect, useRef, useState } from 'react';
import MarkdownTextarea from '../MarkdownTextarea'

// Dropdown limits from the WhatsApp Flow docs (images: 100KB each, JPEG/PNG; 100 options max when any image is used, else 200).
const DESCRIPTION_MAX_LENGTH = 300;
const METADATA_MAX_LENGTH = 20;
const OPTION_IMAGE_MAX_SIZE = 100 * 1024;
const OPTION_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const MAX_OPTIONS = 200;
const MAX_OPTIONS_WITH_IMAGES = 100;

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

// Reusable label + editable option list, shared by Dropdown/Radio/MultipleChoice configs.
// advancedOptions (Dropdown only) enables per-option description/metadata/image, stored in config.optionDetails by option index.
const OptionsField = ({ config, onChange, addLabel, labelMaxLength, advancedOptions = false, optionMaxLength }) => {
    const options = config.options?.length ? config.options : [''];
    const advanced = advancedOptions && !!config.advanced;
    const details = config.optionDetails ?? [];
    const hasImages = advanced && details.some((detail) => detail?.image);
    const maxOptions = advancedOptions ? (hasImages ? MAX_OPTIONS_WITH_IMAGES : MAX_OPTIONS) : Infinity;
    const [imageError, setImageError] = useState({});
    const focusIndexRef = useRef(null);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (focusIndexRef.current !== null) {
            inputRefs.current[focusIndexRef.current]?.focus();
            focusIndexRef.current = null;
        }
    }, [options.length]);

    const updateOption = (index, value) => {
        onChange({ ...config, options: options.map((option, i) => (i === index ? value : option)) });
    };

    const addOption = () => {
        if (options.length >= maxOptions) return;
        onChange({ ...config, options: [...options, ''] });
    };
    const removeOption = (index) => onChange({
        ...config,
        options: options.filter((_, i) => i !== index),
        ...(advancedOptions ? { optionDetails: details.filter((_, i) => i !== index) } : {}),
    });

    const updateDetail = (index, patch) => {
        const next = options.map((_, i) => details[i] ?? {});
        next[index] = { ...next[index], ...patch };
        onChange({ ...config, optionDetails: next });
    };

    const handleImage = async (index, file) => {
        if (!file) return;
        const fail = (message) => setImageError((prev) => ({ ...prev, [index]: message }));
        if (!OPTION_IMAGE_TYPES.includes(file.type)) return fail('Acceptable file types: JPEG, PNG');
        if (file.size > OPTION_IMAGE_MAX_SIZE) return fail('Maximum file size: 100kb');
        setImageError((prev) => ({ ...prev, [index]: '' }));
        const dataUrl = await readFileAsDataUrl(file);
        updateDetail(index, { image: dataUrl.split(',')[1] ?? '', imageMimeType: file.type });
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            focusIndexRef.current = options.length;
            addOption();
        }
    };

    return (
        <div className="config-panel">
            <label>
                <span className="label-row">
                    Label
                    <span className="field-char-counter">{(config.label ?? '').length}/{labelMaxLength}</span>
                </span>
                <input
                    type="text"
                    value={config.label ?? ''}
                    maxLength={labelMaxLength}
                    onChange={(event) => onChange({ ...config, label: event.target.value })}
                    placeholder="Question label"
                />
            </label>
            <MarkdownTextarea
                label={<>Top text: <span className="label-optional">(optional)</span></>}
                value={config.topText ?? ''}
                onChange={(topText) => onChange({ ...config, topText })}
                placeholder="Text shown above this field"
            />
            {advancedOptions && (
                <label className="config-checkbox">
                    <input
                        type="checkbox"
                        checked={advanced}
                        onChange={(event) => onChange({ ...config, advanced: event.target.checked })}
                    />
                    Advanced options (description, metadata and image)
                </label>
            )}
            <div className="config-options">
                {options.map((option, index) => {
                    const detail = details[index] ?? {};
                    return (
                        <div className="config-option-block" key={index}>
                            <div className="config-option-row">
                                <input
                                    type="text"
                                    ref={(element) => { inputRefs.current[index] = element; }}
                                    value={option}
                                    maxLength={optionMaxLength}
                                    onChange={(event) => updateOption(index, event.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={`Option ${index + 1}`}
                                />
                                <button type="button" onClick={() => removeOption(index)} disabled={options.length === 1}>×</button>
                            </div>
                            {advanced && (
                                <div className="config-option-extras">
                                    <label>
                                        <span className="label-row">
                                            Description <span className="label-optional">(optional)</span>
                                            <span className="field-char-counter">{(detail.description ?? '').length}/{DESCRIPTION_MAX_LENGTH}</span>
                                        </span>
                                        <input
                                            type="text"
                                            value={detail.description ?? ''}
                                            maxLength={DESCRIPTION_MAX_LENGTH}
                                            onChange={(event) => updateDetail(index, { description: event.target.value })}
                                        />
                                    </label>
                                    <label>
                                        <span className="label-row">
                                            Metadata <span className="label-optional">(optional)</span>
                                            <span className="field-char-counter">{(detail.metadata ?? '').length}/{METADATA_MAX_LENGTH}</span>
                                        </span>
                                        <input
                                            type="text"
                                            value={detail.metadata ?? ''}
                                            maxLength={METADATA_MAX_LENGTH}
                                            onChange={(event) => updateDetail(index, { metadata: event.target.value })}
                                        />
                                    </label>
                                    <div className="config-option-image">
                                        {detail.image && (
                                            <img
                                                src={`data:${detail.imageMimeType || 'image/png'};base64,${detail.image}`}
                                                alt=""
                                                className="config-option-image-preview"
                                            />
                                        )}
                                        <label className="config-option-image-upload">
                                            {detail.image ? 'Change image' : 'Add image'} (JPEG/PNG, max 100kb)
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png"
                                                hidden
                                                onChange={(event) => { handleImage(index, event.target.files?.[0]); event.target.value = ''; }}
                                            />
                                        </label>
                                        {detail.image && (
                                            <button type="button" onClick={() => updateDetail(index, { image: '', imageMimeType: '' })}>Remove image</button>
                                        )}
                                    </div>
                                    {imageError[index] && <p className="image-dropzone-error">{imageError[index]}</p>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <button type="button" onClick={addOption} disabled={options.length >= maxOptions}>{addLabel}</button>
        </div>
    );
}

export default OptionsField;

