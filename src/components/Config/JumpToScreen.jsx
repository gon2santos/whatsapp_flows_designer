import { toDataSource } from '../../data/nodeDefinitions'

// Conditional navigation editor shared by Dropdown/Radio configs: one or more "If [option] go to [screen]"
// rules, one per data-source option at most. Stored as config.jumpConditions = [{ optionId, screenId }, ...].
const JumpToScreen = ({ config, onChange, screens = [], activeScreenId }) => {
    const options = toDataSource(config.options);
    const otherScreens = screens.filter((screen) => screen.id !== activeScreenId);
    const jumps = config.jumpConditions ?? [];
    // Always show at least one (possibly empty) row, matching the single-condition UI this replaces.
    const displayJumps = jumps.length ? jumps : [{ optionId: '', screenId: '' }];
    const canAddMore = displayJumps.length < options.length;

    const updateJump = (index, nextJump) => {
        onChange({ ...config, jumpConditions: displayJumps.map((jump, i) => (i === index ? nextJump : jump)) });
    };

    const addJump = () => onChange({ ...config, jumpConditions: [...displayJumps, { optionId: '', screenId: '' }] });

    const removeJump = (index) => {
        const nextJumps = displayJumps.filter((_, i) => i !== index);
        onChange({ ...config, jumpConditions: nextJumps.length ? nextJumps : undefined });
    };

    // Options already picked by other rows can't be picked again; the row's own current value stays selectable.
    const optionsFor = (index) => {
        const usedElsewhere = new Set(displayJumps.filter((_, i) => i !== index).map((jump) => jump.optionId).filter(Boolean));
        return options.filter((option) => !usedElsewhere.has(option.id));
    };

    return (
        <div className="config-panel config-jump-panel">
            <h3 className="config-section-title">Jump to Screen</h3>
            {displayJumps.map((jump, index) => (
                <div className="config-jump-row" key={index}>
                    <span>If</span>
                    <select
                        value={jump.optionId}
                        onChange={(event) => updateJump(index, { ...jump, optionId: event.target.value })}
                    >
                        <option value="">Selecciona una opción</option>
                        {optionsFor(index).map((option) => (
                            <option key={option.id} value={option.id}>{option.title}</option>
                        ))}
                    </select>
                    <span>go to</span>
                    <select
                        value={jump.screenId}
                        onChange={(event) => updateJump(index, { ...jump, screenId: event.target.value })}
                        disabled={!jump.optionId || otherScreens.length === 0}
                    >
                        <option value="">Selecciona una pantalla</option>
                        {otherScreens.map((screen) => (
                            <option key={screen.id} value={screen.id}>{screen.name}</option>
                        ))}
                    </select>
                    <button type="button" onClick={() => removeJump(index)} aria-label="Remove condition">×</button>
                </div>
            ))}
            <button type="button" onClick={addJump} disabled={!canAddMore}>Add condition</button>
        </div>
    );
}

export default JumpToScreen;

