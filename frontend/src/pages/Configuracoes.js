import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondary,
  Avatar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Palette as PaletteIcon,
  CreditCard as CreditCardIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  ColorLens as ColorLensIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../services/api';

function Configuracoes() {
  // Estados para as diferentes seções
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estados para categorias
  const [categorias, setCategorias] = useState([]);
  const [openCategoriaDialog, setOpenCategoriaDialog] = useState(false);
  const [openDeleteCategoriaDialog, setOpenDeleteCategoriaDialog] = useState(false);
  const [currentCategoria, setCurrentCategoria] = useState({
    nome: '',
    cor: '#1976d2',
    descricao: ''
  });
  
  // Estados para perfil de usuário
  const [usuario, setUsuario] = useState({
    nome: '',
    email: '',
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  });
  const [alterandoSenha, setAlterandoSenha] = useState(false);
  
  // Estados para preferências
  const [preferencias, setPreferencias] = useState({
    tema: 'claro',
    notificacoes_email: true,
    notificacoes_sistema: true,
    moeda: 'BRL',
    formato_data: 'dd/MM/yyyy'
  });

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
  }, []);

  // Função para carregar todos os dados necessários
  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Carregar categorias
      if (tabValue === 0) {
        const categoriasData = await api.listarCategorias();
        setCategorias(categoriasData || []);
      }
      
      // Carregar dados do usuário
      if (tabValue === 1) {
        const usuarioData = await api.obterPerfilUsuario();
        if (usuarioData) {
          setUsuario({
            ...usuarioData,
            senha_atual: '',
            nova_senha: '',
            confirmar_senha: ''
          });
        }
      }
      
      // Carregar preferências
      if (tabValue === 2) {
        const preferenciasData = await api.obterPreferencias();
        if (preferenciasData) {
          setPreferencias(preferenciasData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Falha ao carregar dados. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [tabValue]);

  // Funções para manipulação de categorias
  const handleOpenCategoriaDialog = (categoria = null) => {
    if (categoria) {
      // Editar categoria existente
      setCurrentCategoria({
        ...categoria
      });
    } else {
      // Nova categoria
      setCurrentCategoria({
        nome: '',
        cor: '#1976d2',
        descricao: ''
      });
    }
    setOpenCategoriaDialog(true);
  };

  const handleCloseCategoriaDialog = () => {
    setOpenCategoriaDialog(false);
  };

  const handleOpenDeleteCategoriaDialog = (categoria) => {
    setCurrentCategoria(categoria);
    setOpenDeleteCategoriaDialog(true);
  };

  const handleCloseDeleteCategoriaDialog = () => {
    setOpenDeleteCategoriaDialog(false);
  };

  const handleCategoriaInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCategoria({
      ...currentCategoria,
      [name]: value
    });
  };

  const handleSaveCategoria = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (currentCategoria.id) {
        await api.atualizarCategoria(currentCategoria.id, currentCategoria);
        setSuccess('Categoria atualizada com sucesso!');
      } else {
        await api.criarCategoria(currentCategoria);
        setSuccess('Categoria criada com sucesso!');
      }

      handleCloseCategoriaDialog();
      carregarDados();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      setError('Falha ao salvar categoria. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategoria = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await api.excluirCategoria(currentCategoria.id);
      
      setSuccess('Categoria excluída com sucesso!');
      handleCloseDeleteCategoriaDialog();
      carregarDados();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      setError('Falha ao excluir categoria. Verifique se não há despesas associadas a ela.');
    } finally {
      setLoading(false);
    }
  };

  // Funções para manipulação de perfil de usuário
  const handleUsuarioInputChange = (e) => {
    const { name, value } = e.target;
    setUsuario({
      ...usuario,
      [name]: value
    });
  };

  const handleSaveUsuario = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validar senha se estiver alterando
      if (alterandoSenha) {
        if (!usuario.senha_atual) {
          setError('A senha atual é obrigatória.');
          setLoading(false);
          return;
        }
        
        if (usuario.nova_senha !== usuario.confirmar_senha) {
          setError('A nova senha e a confirmação não coincidem.');
          setLoading(false);
          return;
        }
      }
      
      // Preparar dados para envio
      const dadosUsuario = {
        nome: usuario.nome,
        email: usuario.email
      };
      
      if (alterandoSenha) {
        dadosUsuario.senha_atual = usuario.senha_atual;
        dadosUsuario.nova_senha = usuario.nova_senha;
      }
      
      await api.atualizarPerfilUsuario(dadosUsuario);
      
      setSuccess('Perfil atualizado com sucesso!');
      
      // Resetar campos de senha
      setUsuario({
        ...usuario,
        senha_atual: '',
        nova_senha: '',
        confirmar_senha: ''
      });
      
      setAlterandoSenha(false);
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setError('Falha ao atualizar perfil. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Funções para manipulação de preferências
  const handlePreferenciasChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = e.target.type === 'checkbox' ? checked : value;
    
    setPreferencias({
      ...preferencias,
      [name]: newValue
    });
  };

  const handleSavePreferencias = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await api.atualizarPreferencias(preferencias);
      
      setSuccess('Preferências atualizadas com sucesso!');
      
      // Aplicar tema imediatamente
      document.documentElement.setAttribute('data-theme', preferencias.tema);
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      setError('Falha ao atualizar preferências. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Função para alternar entre as abas
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Renderização
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Configurações
      </Typography>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabs de Configurações */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="configurações tabs">
          <Tab icon={<CategoryIcon />} label="Categorias" />
          <Tab icon={<PersonIcon />} label="Perfil" />
          <Tab icon={<SettingsIcon />} label="Preferências" />
        </Tabs>
      </Box>

      {/* Conteúdo das Tabs */}
      <Box sx={{ mt: 2 }}>
        {/* Tab 1: Categorias */}
        {tabValue === 0 && (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenCategoriaDialog()}
              >
                Nova Categoria
              </Button>
            </Box>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cor</TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Criada em</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && categorias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress size={24} sx={{ my: 2 }} />
                        <Typography variant="body2">Carregando categorias...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : categorias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body1" sx={{ my: 2 }}>
                          Nenhuma categoria encontrada.
                        </Typography>
                        <Button 
                          variant="outlined" 
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenCategoriaDialog()}
                        >
                          Adicionar Categoria
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    categorias.map((categoria) => (
                      <TableRow key={categoria.id}>
                        <TableCell>
                          <Box 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: '50%', 
                              bgcolor: categoria.cor || '#1976d2' 
                            }} 
                          />
                        </TableCell>
                        <TableCell>{categoria.nome}</TableCell>
                        <TableCell>{categoria.descricao || '-'}</TableCell>
                        <TableCell>
                          {categoria.data_criacao ? format(new Date(categoria.data_criacao), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenCategoriaDialog(categoria)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleOpenDeleteCategoriaDialog(categoria)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 2: Perfil */}
        {tabValue === 1 && (
          <Paper sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Informações Pessoais
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nome"
                        name="nome"
                        value={usuario.nome}
                        onChange={handleUsuarioInputChange}
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="E-mail"
                        name="email"
                        type="email"
                        value={usuario.email}
                        onChange={handleUsuarioInputChange}
                        required
                      />
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Alterar Senha
                    </Typography>
                    <Switch
                      checked={alterandoSenha}
                      onChange={(e) => setAlterandoSenha(e.target.checked)}
                      color="primary"
                    />
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {alterandoSenha && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Senha Atual"
                          name="senha_atual"
                          type="password"
                          value={usuario.senha_atual}
                          onChange={handleUsuarioInputChange}
                          required
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Nova Senha"
                          name="nova_senha"
                          type="password"
                          value={usuario.nova_senha}
                          onChange={handleUsuarioInputChange}
                          required
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Confirmar Nova Senha"
                          name="confirmar_senha"
                          type="password"
                          value={usuario.confirmar_senha}
                          onChange={handleUsuarioInputChange}
                          required
                          error={usuario.nova_senha !== usuario.confirmar_senha}
                          helperText={usuario.nova_senha !== usuario.confirmar_senha ? 'As senhas não coincidem' : ''}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleSaveUsuario}
                      startIcon={<SaveIcon />}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Salvar Alterações'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </Paper>
        )}

        {/* Tab 3: Preferências */}
        {tabValue === 2 && (
          <Paper sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Aparência
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Tema</InputLabel>
                        <Select
                          name="tema"
                          value={preferencias.tema}
                          onChange={handlePreferenciasChange}
                          label="Tema"
                        >
                          <MenuItem value="claro">Claro</MenuItem>
                          <MenuItem value="escuro">Escuro</MenuItem>
                          <MenuItem value="sistema">Seguir Sistema</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Notificações
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferencias.notificacoes_email}
                            onChange={handlePreferenciasChange}
                            name="notificacoes_email"
                            color="primary"
                          />
                        }
                        label="Receber notificações por e-mail"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferencias.notificacoes_sistema}
                            onChange={handlePreferenciasChange}
                            name="notificacoes_sistema"
                            color="primary"
                          />
                        }
                        label="Receber notificações no sistema"
                      />
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Formatação
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Moeda</InputLabel>
                        <Select
                          name="moeda"
                          value={preferencias.moeda}
                          onChange={handlePreferenciasChange}
                          label="Moeda"
                        >
                          <MenuItem value="BRL">Real (R$)</MenuItem>
                          <MenuItem value="USD">Dólar ($)</MenuItem>
                          <MenuItem value="EUR">Euro (€)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Formato de Data</InputLabel>
                        <Select
                          name="formato_data"
                          value={preferencias.formato_data}
                          onChange={handlePreferenciasChange}
                          label="Formato de Data"
                        >
                          <MenuItem value="dd/MM/yyyy">DD/MM/AAAA</MenuItem>
                          <MenuItem value="MM/dd/yyyy">MM/DD/AAAA</MenuItem>
                          <MenuItem value="yyyy-MM-dd">AAAA-MM-DD</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleSavePreferencias}
                      startIcon={<SaveIcon />}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Salvar Preferências'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </Paper>
        )}
      </Box>

      {/* Dialog de criação/edição de categoria */}
      <Dialog open={openCategoriaDialog} onClose={handleCloseCategoriaDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentCategoria.id ? 'Editar Categoria' : 'Nova Categoria'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome da Categoria"
                name="nome"
                value={currentCategoria.nome}
                onChange={handleCategoriaInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="descricao"
                value={currentCategoria.descricao}
                onChange={handleCategoriaInputChange}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: '50%', 
                    bgcolor: currentCategoria.cor || '#1976d2',
                    mr: 2
                  }} 
                />
                <TextField
                  label="Cor"
                  name="cor"
                  value={currentCategoria.cor}
                  onChange={handleCategoriaInputChange}
                  type="color"
                  sx={{ width: '100%' }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ColorLensIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoriaDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveCategoria} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão de categoria */}
      <Dialog open={openDeleteCategoriaDialog} onClose={handleCloseDeleteCategoriaDialog}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir a categoria "{currentCategoria.nome}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Atenção: Se houver despesas associadas a esta categoria, elas ficarão sem categoria.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteCategoriaDialog}>Cancelar</Button>
          <Button 
            onClick={handleDeleteCategoria} 
            variant="contained" 
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Configuracoes;
