import './App.css'
import { DragDropProvider } from '@dnd-kit/react'
import PaletteContainer from './views/Config/PaletteContainer'
import FormContainer from './views/FormContainer'
import { useFormBuilder } from './hooks/useFormBuilder'

function App() {
  const {
    screens,
    activeScreenId,
    items,
    addScreen,
    removeScreen,
    selectScreen,
    handleDragOver,
    handleDragEnd,
  } = useFormBuilder();

  return (
    <DragDropProvider onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="app-container">
        <PaletteContainer />
        <FormContainer
          screens={screens}
          activeScreenId={activeScreenId}
          items={items}
          onAddScreen={addScreen}
          onRemoveScreen={removeScreen}
          onSelectScreen={selectScreen}
        />
      </div>
    </DragDropProvider>
  )
}

export default App
