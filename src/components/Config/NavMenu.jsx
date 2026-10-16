import { useState } from 'react'
import { collectLinkedScreenIds } from '../../utils/linkedScreens'
import { NAV_MENU_LIMITS as LIMITS, createNavMenuItem } from '../../utils/navMenu'
import '../../assets/CSS/NavMenu.css'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const CharCounter = ({ value, max }) => <span className="field-char-counter">{(value ?? '').length}/{max}</span>;

const TextField = ({ label, value, max, onChange, disabled, placeholder, multiline }) => {
    const Tag = multiline ? 'textarea' : 'input';
    return (
        <label>
            <span className="label-row">{label}<CharCounter value={value} max={max} /></span>
            <Tag
                {...(multiline ? { rows: 3 } : { type: 'text' })}
                value={value ?? ''}
                maxLength={max}
                disabled={disabled}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
            />
        </label>
    );
};

const ScreenSelect = ({ value, onChange, screens, placeholder }) => (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {screens.map((screen) => <option key={screen.id} value={screen.id}>{screen.name}</option>)}
    </select>
);

// Accordion section: only one section of an item is open at a time, controlled by the parent.
const Section = ({ id, title, openId, onToggle, children }) => {
    const isOpen = openId === id;
    return (
        <div className="navmenu-section">
            <button type="button" className="navmenu-section-header" aria-expanded={isOpen} onClick={() => onToggle(isOpen ? null : id)}>
                <span>{title}</span>
                <span aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && <div className="navmenu-section-body">{children}</div>}
        </div>
    );
};

const NavMenuItemEditor = ({ item, index, total, config, hasBadgeElsewhere, targetScreens, onChange, onRemove }) => {
    const [error, setError] = useState('');
    const [openSection, setOpenSection] = useState('main');
    const isLarge = config.mediaSize === 'large';
    const isItemLevel = config.actionLevel === 'item';
    const update = (patch) => onChange({ ...item, ...patch });
    const tags = item.tags ?? [];

    const handleImage = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (!ACCEPTED_TYPES.includes(file.type)) { setError('Acceptable file types: JPEG, PNG'); return; }
        if (file.size > LIMITS.imageBytes) { setError('Maximum file size: 100kb'); return; }
        setError('');
        const dataUrl = await readFileAsDataUrl(file);
        update({ image: dataUrl.split(',')[1] ?? '', imageMimeType: file.type, imageName: file.name });
    };

    const updateTag = (tagIndex, value) => update({ tags: tags.map((tag, i) => (i === tagIndex ? value : tag)) });

    return (
        <details className="navmenu-item" open={index === 0}>
            <summary>{item.title?.trim() || `Item ${index + 1}`}</summary>
            <div className="navmenu-item-body">
                <Section id="main" title="Main content" openId={openSection} onToggle={setOpenSection}>
                    <TextField label="Title" value={item.title} max={LIMITS.mainTitle} onChange={(title) => update({ title })} placeholder="Required" />
                    <TextField label="Description" value={item.description} max={LIMITS.mainDescription} onChange={(description) => update({ description })} />
                    <TextField label="Metadata" value={item.metadata} max={LIMITS.mainMetadata} onChange={(metadata) => update({ metadata })} />
                </Section>

                <Section id="end" title="End add-on" openId={openSection} onToggle={setOpenSection}>
                    {isLarge && <p className="navmenu-hint">Not available when media size is Large.</p>}
                    <TextField label="Title" value={item.endTitle} max={LIMITS.endText} disabled={isLarge} onChange={(endTitle) => update({ endTitle })} />
                    <TextField label="Description" value={item.endDescription} max={LIMITS.endText} disabled={isLarge} onChange={(endDescription) => update({ endDescription })} />
                </Section>

                <Section id="start" title="Start add-on (image)" openId={openSection} onToggle={setOpenSection}>
                    {item.image ? (
                        <div className="navmenu-image">
                            <img src={`data:${item.imageMimeType || 'image/png'};base64,${item.image}`} alt={item.altText || item.imageName || 'Item image'} />
                            <button type="button" onClick={() => update({ image: '', imageMimeType: '', imageName: '', altText: '' })}>Remove image</button>
                        </div>
                    ) : (
                        <label>
                            Image
                            <input type="file" accept="image/jpeg,image/png" onChange={handleImage} />
                        </label>
                    )}
                    {error && <p className="config-field-error">{error}</p>}
                    <p className="navmenu-hint">Maximum file size: 100kb. Acceptable file types: JPEG, PNG</p>
                    <TextField label="Alt text" value={item.altText} max={200} disabled={!item.image} onChange={(altText) => update({ altText })} />
                </Section>

                <Section id="badge" title="Badge and tags" openId={openSection} onToggle={setOpenSection}>
                    <TextField
                        label="Badge"
                        value={item.badge}
                        max={LIMITS.badge}
                        disabled={hasBadgeElsewhere}
                        onChange={(badge) => update({ badge })}
                        placeholder={hasBadgeElsewhere ? 'Only one item per list can have a badge' : ''}
                    />
                    {tags.map((tag, tagIndex) => (
                        <div className="config-option-row" key={tagIndex}>
                            <input
                                type="text"
                                value={tag}
                                maxLength={LIMITS.tag}
                                placeholder={`Tag ${tagIndex + 1} (max ${LIMITS.tag} characters)`}
                                onChange={(event) => updateTag(tagIndex, event.target.value)}
                            />
                            <button type="button" onClick={() => update({ tags: tags.filter((_, i) => i !== tagIndex) })}>×</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => update({ tags: [...tags, ''] })} disabled={tags.length >= LIMITS.maxTags}>Add tag</button>
                </Section>

                {isItemLevel && (
                    <Section id="click" title="On click" openId={openSection} onToggle={setOpenSection}>
                        <ScreenSelect value={item.screenId ?? ''} onChange={(screenId) => update({ screenId })} screens={targetScreens} placeholder="Next screen (default)" />
                    </Section>
                )}
                <button className='remove-item-btn' type="button" onClick={onRemove} disabled={total <= LIMITS.minItems}>Remove item</button>
            </div>
        </details>
    );
};

const NavMenu = ({ config, onChange, screens = [], activeScreenId }) => {
    const items = config.items?.length ? config.items : [createNavMenuItem()];
    const linkedScreenIds = collectLinkedScreenIds(screens);
    const targetScreens = screens.filter((screen) => screen.id !== activeScreenId && !linkedScreenIds.has(screen.id));
    const badgeIndex = items.findIndex((item) => item.badge?.trim());

    const setItems = (nextItems) => onChange({ ...config, items: nextItems });
    const updateItem = (index, nextItem) => setItems(items.map((item, i) => (i === index ? nextItem : item)));

    // "end" isn't allowed with a large media size, so switching to Large clears it.
    const setMediaSize = (mediaSize) => onChange({
        ...config,
        mediaSize,
        ...(mediaSize === 'large' ? { items: items.map((item) => ({ ...item, endTitle: '', endDescription: '' })) } : {}),
    });

    return (
        <div className="config-panel">
            <TextField label="Label" value={config.label} max={LIMITS.label} onChange={(label) => onChange({ ...config, label })} placeholder="Optional" />
            <TextField label="Description" value={config.description} max={LIMITS.description} multiline onChange={(description) => onChange({ ...config, description })} placeholder="Optional" />
            <label>
                Media size
                <select value={config.mediaSize ?? 'regular'} onChange={(event) => setMediaSize(event.target.value)}>
                    <option value="regular">Regular</option>
                    <option value="large">Large</option>
                </select>
            </label>

            <h3 className="config-section-title">On click action</h3>
            <label>
                Defined at
                <select value={config.actionLevel ?? 'item'} onChange={(event) => onChange({ ...config, actionLevel: event.target.value })}>
                    <option value="item">Each item (different actions)</option>
                    <option value="component">Component (same action for all items)</option>
                </select>
            </label>
            {config.actionLevel === 'component' && (
                <ScreenSelect value={config.screenId ?? ''} onChange={(screenId) => onChange({ ...config, screenId })} screens={targetScreens} placeholder="Next screen (default)" />
            )}

            <h3 className="config-section-title">Items ({items.length}/{LIMITS.maxItems})</h3>
            {items.map((item, index) => (
                <NavMenuItemEditor
                    key={index}
                    item={item}
                    index={index}
                    total={items.length}
                    config={config}
                    hasBadgeElsewhere={badgeIndex !== -1 && badgeIndex !== index}
                    targetScreens={targetScreens}
                    onChange={(nextItem) => updateItem(index, nextItem)}
                    onRemove={() => setItems(items.filter((_, i) => i !== index))}
                />
            ))}
            <button type="button" onClick={() => setItems([...items, createNavMenuItem()])} disabled={items.length >= LIMITS.maxItems}>Add item</button>
        </div>
    );
}

export default NavMenu;
