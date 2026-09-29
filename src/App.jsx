import './App.css'
import { DragDropProvider } from '@dnd-kit/react'
import PaletteContainer from './views/Config/PaletteContainer'
import PreviewPanel from './views/PreviewPanel'
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
    handleDragOver,
    handleDragEnd,
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
        />
      </div>
    </DragDropProvider>
  )
}

export default App
