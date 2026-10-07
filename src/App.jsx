import './App.css'
import { DragDropProvider } from '@dnd-kit/react'
import PaletteContainer from './views/Config/PaletteContainer'
import PreviewPanel from './views/PreviewPanel'
import Modal from './components/Modal'
import Footer from './components/Footer'
import { useFormBuilder } from './hooks/useFormBuilder'

function App() {
  const {
    screens,
    activeScreenId,
    items,
    addScreen,
    removeScreen,
    selectScreen,
    renameScreen,
    setFooterLabel,
    updateItemConfig,
    pruneDisallowedNodes,
    handleDragOver,
    handleDragEnd,
    restrictedDropMessage,
    dismissRestrictedDropMessage,
    importFlowJson,
    lockRequired,
    toggleLockRequired,
  } = useFormBuilder();

  return (
    <>
      <DragDropProvider onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="app-container">
          <PaletteContainer />
          <PreviewPanel
            screens={screens}
            activeScreenId={activeScreenId}
            items={items}
            onAddScreen={addScreen}
            onRemoveScreen={removeScreen}
            onSelectScreen={selectScreen}
            onRenameScreen={renameScreen}
            onFooterLabelChange={setFooterLabel}
            onConfigChange={updateItemConfig}
            onPruneLinkedScreen={pruneDisallowedNodes}
            onImportJson={importFlowJson}
            lockRequired={lockRequired}
            onToggleLockRequired={toggleLockRequired}
          />
        </div>
        {restrictedDropMessage && (
          <Modal title="Nodo no permitido" onClose={dismissRestrictedDropMessage}>
            <p>{restrictedDropMessage}</p>
          </Modal>
        )}
      </DragDropProvider>
      <Footer />
    </>
  )
}

export default App
