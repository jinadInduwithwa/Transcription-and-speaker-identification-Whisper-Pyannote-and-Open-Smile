import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MeetingDashboard from './components/MeetingDashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

function App() {
  // Simple auth check simulation
  const isAuthenticated = true; // For now, allow dashboard access

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#020617] text-slate-100">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={
            isAuthenticated ? <MeetingDashboard /> : <Navigate to="/login" />
          } />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
