import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import SelectRole from './pages/SelectRole'
import Register from './pages/Register'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SelectRole />} />
        <Route path="/register/:role" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
