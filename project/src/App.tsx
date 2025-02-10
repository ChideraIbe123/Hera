import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './components/AuthProvider';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/onboarding" element={
            // <RequireAuth>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>}>
                <Onboarding />
              </Suspense>
            // </RequireAuth>
          } />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>}>
                  <Dashboard />
                </Suspense>
               </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App