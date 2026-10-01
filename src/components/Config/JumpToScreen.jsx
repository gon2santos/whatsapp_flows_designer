import { toDataSource } from '../../data/nodeDefinitions'

// Conditional navigation editor shared by Dropdown/Radio configs: "If [option] go to [screen]".
// Stored as config.jumpCondition = { optionId, screenId }; omitted entirely once no option is selected.
const JumpToScreen = ({ config, onChange, screens = [], activeScreenId }) => {
    const options = toDataSource(config.options);
    const otherScreens = screens.filter((screen) => screen.id !== activeScreenId);
    const jump = config.jumpCondition ?? { optionId: '', screenId: '' };

    const updateJump = (nextJump) => {
        onChange({ ...config, jumpCondition: nextJump.optionId ? nextJump : undefined });
    };

    return (
        <div className="config-panel config-jump-panel">
            <h3 className="config-section-title">Jump to Screen</h3>
            <div className="config-jump-row">
                <span>If</span>
                <select
                    value={jump.optionId}
                    onChange={(event) => updateJump({ ...jump, optionId: event.target.value })}
                >
                    <option value="">Selecciona una opción</option>
                    {options.map((option) => (
                        <option key={option.id} value={option.id}>{option.title}</option>
                    ))}
                </select>
                <span>go to</span>
                <select
                    value={jump.screenId}
                    onChange={(event) => updateJump({ ...jump, screenId: event.target.value })}
                    disabled={!jump.optionId || otherScreens.length === 0}
                >
                    <option value="">Selecciona una pantalla</option>
                    {otherScreens.map((screen) => (
                        <option key={screen.id} value={screen.id}>{screen.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default JumpToScreen;
