import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Se ainda estiver carregando, não faz nada
  if (loading) {
    return null;
  }

  // Se não estiver autenticado, redireciona para o login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver autenticado, renderiza o layout com o conteúdo
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoute;
