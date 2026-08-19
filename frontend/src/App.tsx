import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { useAuthStore } from './store/authStore';
import { useThemeStore, applyTheme } from './store/themeStore';
import PrivateRoute from './components/layout/PrivateRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Voices from './pages/Voices';
import VoiceDetail from './pages/VoiceDetail';
import AppLayout from './components/layout/AppLayout';
import Generate from './pages/Generate';

// Placeholder Pages for Phase 2
const History = () => <div className="p-8">History Page</div>;
const Settings = () => <div className="p-8">Settings Page</div>;
const NotFound = () => <div className="p-8">404 Not Found</div>;

function App() {
  const { initializeAuthListener } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    initializeAuthListener();
  }, [initializeAuthListener]);

  // Ensure theme is applied globally on initial load (for all pages including Landing/Login)
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/voices" element={<Voices />} />
            <Route path="/voices/:id" element={<VoiceDetail />} />
            <Route path="/generate" element={<Generate />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
