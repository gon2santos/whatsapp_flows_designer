import { toDataSource } from '../../data/nodeDefinitions'

const MAX_CONDITIONS = 3;
const emptyCondition = () => ({ nodeId: '', operator: 'equals', optionId: '', logicalOperator: 'and' });

// Up to 3 "If [node] [equals|not equals] [option]" rules controlling whether this node renders, joined
// pairwise by an AND/OR selector. Stored as config.visibilityConditions; each condition's logicalOperator
// relates it to the PREVIOUS one (ignored on the first condition). condition.open/close count the "(" / ")"
// placed before/after it, so "A and (B or C)" differs from "(A and B) or C". AND binds tighter than OR.
const MAX_PARENS = 2;

const VisibilityConditions = ({ config, onChange, sources }) => {
    const conditions = config.visibilityConditions ?? [];

    const updateCondition = (index, nextCondition) => {
        onChange({ ...config, visibilityConditions: conditions.map((condition, i) => (i === index ? nextCondition : condition)) });
    };

    const cycleParen = (index, key) => updateCondition(index, { ...conditions[index], [key]: ((conditions[index][key] ?? 0) + 1) % (MAX_PARENS + 1) });

    const addCondition = () => onChange({ ...config, visibilityConditions: [...conditions, emptyCondition()] });
    const removeCondition = (index) => onChange({ ...config, visibilityConditions: conditions.filter((_, i) => i !== index) });

    const optionsFor = (nodeId) => toDataSource(sources.find((source) => source.id === nodeId)?.config?.options);

    return (
        <div className="config-panel config-jump-panel">
            <h3 className="config-section-title">Visibility</h3>
            {conditions.map((condition, index) => (
                <div key={index}>
                    {index > 0 && (
                        <div className="config-condition-joiner">
                            <select
                                value={condition.logicalOperator ?? 'and'}
                                onChange={(event) => updateCondition(index, { ...condition, logicalOperator: event.target.value })}
                            >
                                <option value="and">AND</option>
                                <option value="or">OR</option>
                            </select>
                        </div>
                    )}
                    <div className="config-condition-row">
                        <button
                            type="button"
                            title="Open group (click to cycle)"
                            className={`condition-paren-btn${condition.open ? ' is-on' : ''}`}
                            onClick={() => cycleParen(index, 'open')}
                        >
                            {condition.open ? '('.repeat(condition.open) : '('}
                        </button>
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
                        <button
                            type="button"
                            title="Close group (click to cycle)"
                            className={`condition-paren-btn${condition.close ? ' is-on' : ''}`}
                            onClick={() => cycleParen(index, 'close')}
                        >
                            {condition.close ? ')'.repeat(condition.close) : ')'}
                        </button>
                        <button type="button" onClick={() => removeCondition(index)} aria-label="Remove condition">×</button>
                    </div>
                </div>
            ))}
            {conditions.length < MAX_CONDITIONS && (
                <button type="button" onClick={addCondition}>Add condition</button>
            )}
        </div>
    );
}

export default VisibilityConditions;
