import { useState } from 'react'
import '../assets/CSS/PreviewPanel.css'
import GraphicalPreview from './GraphicalPreview'
import JsonPreview from './JsonPreview'

const TABS = [
    { id: 'form', label: 'Form' },
    { id: 'json', label: 'JSON' },
];

const PreviewPanel = ({ screens, onImportJson, ...rest }) => {
    const [activeTab, setActiveTab] = useState('form');

    return (
        <div className="preview-panel">
            <div className="preview-tabs">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`preview-tab ${tab.id === activeTab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'form' ? <GraphicalPreview screens={screens} {...rest} /> : <JsonPreview screens={screens} onImport={onImportJson} />}
        </div>
    )
}

export default PreviewPanel;
