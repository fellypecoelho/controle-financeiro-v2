import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Despesas from './pages/Despesas';
import Aportes from './pages/Aportes';
import Cartoes from './pages/Cartoes';
import Calendario from './pages/Calendario';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<Dashboard />} />
        <Route path="despesas" element={<Despesas />} />
        <Route path="aportes" element={<Aportes />} />
        <Route path="cartoes" element={<Cartoes />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="configuracoes" element={<Configuracoes />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
