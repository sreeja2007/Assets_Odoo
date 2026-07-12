import { createContext, useContext, useState, useCallback } from 'react';
import { users, ROLES } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  const login = useCallback((email, password) => {
    // Mock auth – find user by email (password ignored in mock)
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
