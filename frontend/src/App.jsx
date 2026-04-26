import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing    from './pages/Landing.jsx'
import Assessment from './pages/Assessment.jsx'
import Results    from './pages/Results.jsx'
import Navbar     from './components/Navbar.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"                  element={<Landing />} />
        <Route path="/assessment/:sessionId" element={<Assessment />} />
        <Route path="/results/:sessionId"    element={<Results />} />
      </Routes>
    </BrowserRouter>
  )
}
