import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ae_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ae_token');
    if (token) {
      authAPI.me()
        .then(res => setUser(res.data.user))
        .catch(() => { localStorage.removeItem('ae_token'); localStorage.removeItem('ae_user'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('ae_token', token);
    localStorage.setItem('ae_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { token, user } = res.data;
    localStorage.setItem('ae_token', token);
    localStorage.setItem('ae_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const loginWithGoogle = async (googleToken) => {
    const res = await authAPI.googleLogin({ token: googleToken });
    const { token, user } = res.data;
    localStorage.setItem('ae_token', token);
    localStorage.setItem('ae_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const verifyOTP = async (email, otp) => {
    const res = await authAPI.verifyOTP({ email, otp });
    const { token, user } = res.data;
    localStorage.setItem('ae_token', token);
    localStorage.setItem('ae_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const resendOTP = async (email) => {
    await authAPI.resendOTP({ email });
  };

  const logout = () => {
    localStorage.removeItem('ae_token');
    localStorage.removeItem('ae_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, verifyOTP, resendOTP, logout, loading, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
