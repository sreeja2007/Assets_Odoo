import { createContext, useContext, useState, useCallback } from 'react';
import { users, ROLES } from '../data/mockData';

const AuthContext = createContext(null);
const API_BASE = 'http://localhost:8069';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (response.ok) {
        const json = await response.json();
        if (json.status === 'success') {
          setCurrentUser(json.data);
          setError('');
          return true;
        }
      }
    } catch (e) {
      console.warn("Odoo auth API offline. Falling back to mock login.");
    }

    // Mock auth fallback – find user by email (password ignored in mock)
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      setError('No account found with this email.');
      return false;
    }
    if (found.status === 'Inactive') {
      setError('Your account has been deactivated. Contact your admin.');
      return false;
    }
    setCurrentUser(found);
    setError('');
    return true;
  }, []);

  const signup = useCallback((name, email) => {
    // New signups are always Employee – no role selection
    const newUser = {
      id: `u${Date.now()}`,
      name,
      email,
      role: ROLES.EMPLOYEE,
      departmentId: null,
      status: 'Active',
      avatar: name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    };
    // In mock mode we just log in as the new user
    setCurrentUser(newUser);
    setError('');
    return true;
  }, []);

  const logout = useCallback(() => setCurrentUser(null), []);

  return (
    <AuthContext.Provider value={{ currentUser, login, signup, logout, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
