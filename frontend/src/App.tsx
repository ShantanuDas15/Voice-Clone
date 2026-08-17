import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import PrivateRoute from './components/layout/PrivateRoute';

// Placeholder Pages
const Login = () => <div className="p-8">Login Page</div>;
const Dashboard = () => <div className="p-8">Dashboard Page</div>;
const Generate = () => <div className="p-8">Generate Audio Page</div>;
const History = () => <div className="p-8">History Page</div>;
const Settings = () => <div className="p-8">Settings Page</div>;
const NotFound = () => <div className="p-8">404 Not Found</div>;

function App() {
  const { initializeAuthListener } = useAuthStore();

  useEffect(() => {
    initializeAuthListener();
  }, [initializeAuthListener]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
