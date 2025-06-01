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
  (response) => response.data, // Retorna diretamente response.data
  (error) => {
    // Verifica se o erro é de resposta e se o status é 401 (Não autorizado)
    if (error.response && error.response.status === 401) {
      // Verifica se a URL original da requisição NÃO é a de login para evitar loop
      if (!error.config.url.includes('/auth/login')) {
        console.error("Erro 401 - Não autorizado. Redirecionando para login.");
        localStorage.removeItem('token');
        // Força o redirecionamento para a página de login
        // Use window.location.replace para não adicionar ao histórico
        window.location.replace('/login'); 
      }
    }
    // Rejeita a promessa para que o erro possa ser tratado onde a chamada foi feita
    return Promise.reject(error);
  }
);

// Serviços de API (com /api removido dos endpoints)
const api = {
  // Autenticação
  login: (email, senha) => axiosInstance.post('/auth/login', { email, senha }),
  verificarToken: () => axiosInstance.get('/auth/verificar'),
  
  // Usuários
  listarUsuarios: (filtros = {}) => axiosInstance.get('/usuarios', { params: filtros }),
  obterUsuario: (id) => axiosInstance.get(`/usuarios/${id}`),
  criarUsuario: (dados) => axiosInstance.post('/usuarios', dados),
  atualizarUsuario: (id, dados) => axiosInstance.put(`/usuarios/${id}`, dados),
  excluirUsuario: (id) => axiosInstance.delete(`/usuarios/${id}`),
  obterSaldosUsuarios: () => axiosInstance.get('/usuarios/saldos'),
  
  // Despesas
  listarDespesas: (filtros = {}) => axiosInstance.get('/despesas', { params: filtros }),
  obterDespesa: (id) => axiosInstance.get(`/despesas/${id}`),
  criarDespesa: (dados) => axiosInstance.post('/despesas', dados),
  atualizarDespesa: (id, dados) => axiosInstance.put(`/despesas/${id}`, dados),
  excluirDespesa: (id, excluirFuturas = false) =>
    axiosInstance.delete(`/despesas/${id}`, { params: { excluir_futuras: excluirFuturas } }),
  obterCalendario: (mes, ano) =>
    axiosInstance.get('/despesas/calendario', { params: { mes, ano } }),
  
  // Aportes
  listarAportes: (filtros = {}) => axiosInstance.get('/aportes', { params: filtros }),
  obterAporte: (id) => axiosInstance.get(`/aportes/${id}`),
  criarAporte: (dados) => axiosInstance.post('/aportes', dados),
  atualizarAporte: (id, dados) => axiosInstance.put(`/aportes/${id}`, dados),
  excluirAporte: (id) => axiosInstance.delete(`/aportes/${id}`),
  obterTotaisAportes: (filtros = {}) => axiosInstance.get('/aportes/totais', { params: filtros }),
  
  // Cartões
  listarCartoes: (filtros = {}) => axiosInstance.get('/cartoes', { params: filtros }),
  obterCartao: (id) => axiosInstance.get(`/cartoes/${id}`),
  criarCartao: (dados) => axiosInstance.post('/cartoes', dados),
  atualizarCartao: (id, dados) => axiosInstance.put(`/cartoes/${id}`, dados),
  excluirCartao: (id) => axiosInstance.delete(`/cartoes/${id}`),
  obterFaturaCartao: (id, mes, ano) =>
    axiosInstance.get(`/cartoes/${id}/faturas`, { params: { mes, ano } }),
  obterProximasFaturas: (id, quantidade = 3) =>
    axiosInstance.get(`/cartoes/${id}/proximas_faturas`, { params: { quantidade } }),
  
  // Dashboard
  obterResumoDashboard: (mes, ano) =>
    axiosInstance.get('/dashboard/resumo', { params: { mes, ano } }),
  obterEvolucaoDashboard: (meses = 6) =>
    axiosInstance.get('/dashboard/evolucao', { params: { meses } }),
    
  // Eventos do Calendário (Ajustado para usar /despesas)
  listarEventosCalendario: (params = {}) => 
    axiosInstance.get('/despesas/calendario', { params }), // Reutiliza endpoint de calendário de despesas?
  // Se houver endpoints específicos para eventos, ajuste abaixo:
  // criarEvento: (dados) => axiosInstance.post('/eventos', dados),
  // atualizarEvento: (id, dados) => axiosInstance.put(`/eventos/${id}`, dados),
  // excluirEvento: (id) => axiosInstance.delete(`/eventos/${id}`),
    
  // Categorias
  listarCategorias: () => axiosInstance.get('/categorias'),
  criarCategoria: (dados) => axiosInstance.post('/categorias', dados),
  atualizarCategoria: (id, dados) => axiosInstance.put(`/categorias/${id}`, dados),
  excluirCategoria: (id) => axiosInstance.delete(`/categorias/${id}`),
  
  // Preferências
  obterPreferencias: () => axiosInstance.get('/usuarios/preferencias'),
  atualizarPreferencias: (dados) => axiosInstance.put('/usuarios/preferencias', dados),
  
  // Perfil
  obterPerfilUsuario: () => axiosInstance.get('/usuarios/perfil'),
  atualizarPerfilUsuario: (dados) => axiosInstance.put('/usuarios/perfil', dados),
};

export default api;

