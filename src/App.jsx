import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Pricing from './components/Pricing'
import About from './components/About'
import SignIn from './components/SignIn'
import SignUp from './components/SignUp'
import Onboarding from './components/Onboarding'
import Dashboard from './components/dashboard/Dashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<Features />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/about" element={<About />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}
