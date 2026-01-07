
import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import HRDashboard from './components/HRDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <div className="App">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          <nav className="navbar">
            <h2>ZENVY Payroll</h2>
            <div className="user-info">
              <span>Welcome, {user.name}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </nav>

          {user.role === 'HR' || user.role === 'Admin' ? (
            <HRDashboard token={token} user={user} />
          ) : (
            <EmployeeDashboard token={token} user={user} />
          )}
        </>
      )}
    </div>
  );
}

export default App;