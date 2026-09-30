import './App.css'
import { DragDropProvider } from '@dnd-kit/react'
import PaletteContainer from './views/Config/PaletteContainer'
import PreviewPanel from './views/PreviewPanel'
import Modal from './components/Modal'
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
    updateItemConfig,
    pruneDisallowedNodes,
    handleDragOver,
    handleDragEnd,
    restrictedDropMessage,
    dismissRestrictedDropMessage,
  } = useFormBuilder();

  return (
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
          onConfigChange={updateItemConfig}
          onPruneLinkedScreen={pruneDisallowedNodes}
        />
      </div>
      {restrictedDropMessage && (
        <Modal title="Nodo no permitido" onClose={dismissRestrictedDropMessage}>
          <p>{restrictedDropMessage}</p>
        </Modal>
      )}
    </DragDropProvider>
  )
}

export default App
