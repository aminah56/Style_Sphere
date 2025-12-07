import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const openAuthModal = useCallback((mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setError(null);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setError(null);
  }, []);

  const login = useCallback(async (credentials) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { data } = await authApi.login(credentials);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      closeAuthModal();
      return data;
    } catch (err) {
      const msg = err.response?.data?.message;
      const validationErrors = err.response?.data?.errors;
      const errorText = msg || (validationErrors?.map(e => e.msg).join(', ')) || 'Unable to login.';
      setError(errorText);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [closeAuthModal]);

  const register = useCallback(async (payload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.register(payload);
      await login({ email: payload.email, password: payload.password });
    } catch (err) {
      const msg = err.response?.data?.message;
      const validationErrors = err.response?.data?.errors;
      const errorText = msg || (validationErrors?.map(e => e.msg).join(', ')) || 'Unable to register.';
      setError(errorText);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [login]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    authMode,
    setAuthMode,
    isSubmitting,
    error
  }), [user, login, register, logout, isAuthModalOpen, openAuthModal, closeAuthModal, authMode, isSubmitting, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

