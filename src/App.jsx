import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { InsuranceProvider } from './context/InsuranceContext'
import Navbar from './components/Navbar'
import PreVisit from './pages/PreVisit'
import PostVisit from './pages/PostVisit'
import Community from './pages/Community'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <InsuranceProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 text-slate-900">
          <Navbar />
          <Routes>
            <Route path="/" element={<PreVisit />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/post-visit" element={<PostVisit />} />
            <Route path="/community" element={<Community />} />
          </Routes>
        </div>
      </BrowserRouter>
    </InsuranceProvider>
  )
}
