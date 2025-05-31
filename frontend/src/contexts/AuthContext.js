import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await api.verificarToken();
          setUser(response.user);
        } catch (error) {
          console.error('Erro ao verificar token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (email, senha) => {
    try {
      const response = await api.login(email, senha);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.'
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isAdmin = () => {
    return user && user.tipo === 'admin';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
