import './App.css'
import { DragDropProvider } from '@dnd-kit/react'
import PaletteContainer from './views/Config/PaletteContainer'
import FormContainer from './views/FormContainer'
import { useFormBuilder } from './hooks/useFormBuilder'

function App() {
  const { items, handleDragOver, handleDragEnd } = useFormBuilder();

  return (
    <DragDropProvider onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="app-container">
        <PaletteContainer />
        <FormContainer items={items} />
      </div>
    </DragDropProvider>
  )
}

export default App
