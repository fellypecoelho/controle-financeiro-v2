import axios from 'axios';

// Usa a variável de ambiente definida em .env
const baseURL = process.env.REACT_APP_API_URL;

// Criar instância do axios com configuração base
const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      !error.config.url.includes('/api/auth/login')
    ) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serviços de API
const api = {
  // Autenticação
  login: (email, senha) => axiosInstance.post('/api/auth/login', { email, senha }),
  verificarToken: () => axiosInstance.get('/api/auth/verificar'),
  
  // Usuários
  listarUsuarios: (filtros = {}) => axiosInstance.get('/api/usuarios', { params: filtros }),
  obterUsuario: (id) => axiosInstance.get(`/api/usuarios/${id}`),
  criarUsuario: (dados) => axiosInstance.post('/api/usuarios', dados),
  atualizarUsuario: (id, dados) => axiosInstance.put(`/api/usuarios/${id}`, dados),
  excluirUsuario: (id) => axiosInstance.delete(`/api/usuarios/${id}`),
  obterSaldosUsuarios: () => axiosInstance.get('/api/usuarios/saldos'),
  
  // Despesas
  listarDespesas: (filtros = {}) => axiosInstance.get('/api/despesas', { params: filtros }),
  obterDespesa: (id) => axiosInstance.get(`/api/despesas/${id}`),
  criarDespesa: (dados) => axiosInstance.post('/api/despesas', dados),
  atualizarDespesa: (id, dados) => axiosInstance.put(`/api/despesas/${id}`, dados),
  excluirDespesa: (id, excluirFuturas = false) =>
    axiosInstance.delete(`/api/despesas/${id}`, { params: { excluir_futuras: excluirFuturas } }),
  obterCalendario: (mes, ano) =>
    axiosInstance.get('/api/despesas/calendario', { params: { mes, ano } }),
  
  // Aportes
  listarAportes: (filtros = {}) => axiosInstance.get('/api/aportes', { params: filtros }),
  obterAporte: (id) => axiosInstance.get(`/api/aportes/${id}`),
  criarAporte: (dados) => axiosInstance.post('/api/aportes', dados),
  atualizarAporte: (id, dados) => axiosInstance.put(`/api/aportes/${id}`, dados),
  excluirAporte: (id) => axiosInstance.delete(`/api/aportes/${id}`),
  obterTotaisAportes: (filtros = {}) => axiosInstance.get('/api/aportes/totais', { params: filtros }),
  
  // Cartões
  listarCartoes: (filtros = {}) => axiosInstance.get('/api/cartoes', { params: filtros }),
  obterCartao: (id) => axiosInstance.get(`/api/cartoes/${id}`),
  criarCartao: (dados) => axiosInstance.post('/api/cartoes', dados),
  atualizarCartao: (id, dados) => axiosInstance.put(`/api/cartoes/${id}`, dados),
  excluirCartao: (id) => axiosInstance.delete(`/api/cartoes/${id}`),
  obterFaturaCartao: (id, mes, ano) =>
    axiosInstance.get(`/api/cartoes/${id}/faturas`, { params: { mes, ano } }),
  obterProximasFaturas: (id, quantidade = 3) =>
    axiosInstance.get(`/api/cartoes/${id}/proximas_faturas`, { params: { quantidade } }),
  
  // Dashboard
  obterResumoDashboard: (mes, ano) =>
    axiosInstance.get('/api/dashboard/resumo', { params: { mes, ano } }),
  obterEvolucaoDashboard: (meses = 6) =>
    axiosInstance.get('/api/dashboard/evolucao', { params: { meses } }),
    
  // Eventos do Calendário
  listarEventosCalendario: (params = {}) => 
    axiosInstance.get('/api/despesas/calendario', { params }),
  criarEvento: (dados) => 
    axiosInstance.post('/api/despesas/evento', dados),
  atualizarEvento: (id, dados) => 
    axiosInstance.put(`/api/despesas/evento/${id}`, dados),
  excluirEvento: (id) => 
    axiosInstance.delete(`/api/despesas/evento/${id}`),
    
  // Categorias
  listarCategorias: () => axiosInstance.get('/api/categorias'),
  criarCategoria: (dados) => axiosInstance.post('/api/categorias', dados),
  atualizarCategoria: (id, dados) => axiosInstance.put(`/api/categorias/${id}`, dados),
  excluirCategoria: (id) => axiosInstance.delete(`/api/categorias/${id}`),
  
  // Preferências
  obterPreferencias: () => axiosInstance.get('/api/usuarios/preferencias'),
  atualizarPreferencias: (dados) => axiosInstance.put('/api/usuarios/preferencias', dados),
  
  // Perfil
  obterPerfilUsuario: () => axiosInstance.get('/api/usuarios/perfil'),
  atualizarPerfilUsuario: (dados) => axiosInstance.put('/api/usuarios/perfil', dados),
};

export default api;
