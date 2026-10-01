import { toDataSource } from '../../data/nodeDefinitions'

const MAX_CONDITIONS = 3;
const emptyCondition = () => ({ nodeId: '', operator: 'equals', optionId: '' });

// Up to 3 "If [node] [equals|not equals] [option]" rules controlling whether this node renders.
// Stored as config.visibilityConditions; each one is only applied once nodeId and optionId are both set.
const VisibilityConditions = ({ config, onChange, sources }) => {
    const conditions = config.visibilityConditions ?? [];

    const updateCondition = (index, nextCondition) => {
        onChange({ ...config, visibilityConditions: conditions.map((condition, i) => (i === index ? nextCondition : condition)) });
    };

    const addCondition = () => onChange({ ...config, visibilityConditions: [...conditions, emptyCondition()] });
    const removeCondition = (index) => onChange({ ...config, visibilityConditions: conditions.filter((_, i) => i !== index) });

    const optionsFor = (nodeId) => toDataSource(sources.find((source) => source.id === nodeId)?.config?.options);

    return (
        <div className="config-panel config-jump-panel">
            <h3 className="config-section-title">Visibility</h3>
            {conditions.map((condition, index) => (
                <div className="config-condition-row" key={index}>
                    <span>If</span>
                    <select
                        value={condition.nodeId}
                        onChange={(event) => updateCondition(index, { ...condition, nodeId: event.target.value, optionId: '' })}
                    >
                        <option value="">Selecciona un nodo</option>
                        {sources.map((source) => (
                            <option key={source.id} value={source.id}>{source.config?.id || source.name}</option>
                        ))}
                    </select>
                    <select
                        value={condition.operator}
                        onChange={(event) => updateCondition(index, { ...condition, operator: event.target.value })}
                    >
                        <option value="equals">equals</option>
                        <option value="not-equals">not equals</option>
                    </select>
                    <select
                        value={condition.optionId}
                        onChange={(event) => updateCondition(index, { ...condition, optionId: event.target.value })}
                        disabled={!condition.nodeId}
                    >
                        <option value="">Selecciona una opción</option>
                        {optionsFor(condition.nodeId).map((option) => (
                            <option key={option.id} value={option.id}>{option.title}</option>
                        ))}
                    </select>
                    <button type="button" onClick={() => removeCondition(index)} aria-label="Remove condition">×</button>
                </div>
            ))}
            {conditions.length < MAX_CONDITIONS && (
                <button type="button" onClick={addCondition}>Add condition</button>
            )}
        </div>
    );
}

export default VisibilityConditions;
