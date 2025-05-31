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
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ptBR from 'date-fns/locale/pt-BR';
import { format, parseISO, isValid } from 'date-fns';
import api from '../services/api';

function Aportes() {
  // Estados
  const [aportes, setAportes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentAporte, setCurrentAporte] = useState({
    valor: '',
    data: new Date(),
    investidor_id: '',
    descricao: ''
  });
  const [investidores, setInvestidores] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filtros, setFiltros] = useState({
    investidor_id: '',
    data_inicio: null,
    data_fim: null,
    busca: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resumo, setResumo] = useState({
    total_aportes: 0,
    total_por_investidor: []
  });
  const [showFiltros, setShowFiltros] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
  }, []);

  // Funções para carregar dados
  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Carregar investidores
      const investidoresData = await api.listarInvestidores();
      setInvestidores(investidoresData || []);
      
      // Carregar aportes
      await carregarAportes();
      
      // Carregar resumo
      await carregarResumo();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Falha ao carregar dados. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarAportes = async () => {
    try {
      const response = await api.listarAportes({
        ...filtros,
        page: page + 1,
        limit: rowsPerPage
      });
      setAportes(response.items || []);
    } catch (error) {
      console.error('Erro ao carregar aportes:', error);
      setError('Falha ao carregar aportes. Verifique sua conexão e tente novamente.');
    }
  };

  const carregarResumo = async () => {
    try {
      const response = await api.obterResumoAportes(filtros);
      setResumo(response);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
      setError('Falha ao carregar resumo. Verifique sua conexão e tente novamente.');
    }
  };

  // Funções de manipulação de aportes
  const handleOpenDialog = (aporte = null) => {
    if (aporte) {
      // Editar aporte existente
      setCurrentAporte({
        ...aporte,
        data: aporte.data ? parseISO(aporte.data) : new Date()
      });
    } else {
      // Novo aporte
      setCurrentAporte({
        valor: '',
        data: new Date(),
        investidor_id: '',
        descricao: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (aporte) => {
    setCurrentAporte(aporte);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAporte({
      ...currentAporte,
      [name]: value
    });
  };

  const handleDateChange = (date) => {
    if (isValid(date)) {
      setCurrentAporte({
        ...currentAporte,
        data: date
      });
    }
  };

  const handleSaveAporte = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const aporteData = {
        ...currentAporte,
        valor: parseFloat(currentAporte.valor),
        data: format(currentAporte.data, 'yyyy-MM-dd')
      };

      if (currentAporte.id) {
        await api.atualizarAporte(currentAporte.id, aporteData);
        setSuccess('Aporte atualizado com sucesso!');
      } else {
        await api.criarAporte(aporteData);
        setSuccess('Aporte registrado com sucesso!');
      }

      handleCloseDialog();
      carregarDados();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar aporte:', error);
      setError('Falha ao salvar aporte. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAporte = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await api.excluirAporte(currentAporte.id);
      
      setSuccess('Aporte excluído com sucesso!');
      handleCloseDeleteDialog();
      carregarDados();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao excluir aporte:', error);
      setError('Falha ao excluir aporte. Verifique se não há dependências.');
    } finally {
      setLoading(false);
    }
  };

  // Funções de paginação
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    carregarAportes();
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    carregarAportes();
  };

  // Funções de filtro
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
  };

  const handleFiltroDateChange = (name, date) => {
    if (isValid(date) || date === null) {
      setFiltros({
        ...filtros,
        [name]: date
      });
    }
  };

  const handleSearch = () => {
    setPage(0);
    carregarAportes();
    carregarResumo();
  };

  const handleClearFiltros = () => {
    setFiltros({
      investidor_id: '',
      data_inicio: null,
      data_fim: null,
      busca: ''
    });
    setPage(0);
    carregarAportes();
    carregarResumo();
  };

  // Funções auxiliares
  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getNomeInvestidor = (id) => {
    const investidor = investidores.find(inv => inv.id === id);
    return investidor ? investidor.nome : 'Desconhecido';
  };

  // Renderização
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Aportes
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

      {/* Resumo */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resumo de Aportes
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">
                  Total de Aportes
                </Typography>
                <Typography variant="h5" color="primary">
                  {formatarValor(resumo.total_aportes || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {resumo.total_por_investidor && resumo.total_por_investidor.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    {item.nome_investidor}
                  </Typography>
                  <Typography variant="h5">
                    {formatarValor(item.total || 0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {item.percentual ? `${item.percentual.toFixed(1)}% do total` : '0% do total'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Barra de ações */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar aportes..."
            value={filtros.busca}
            onChange={(e) => handleFiltroChange(e)}
            name="busca"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="outlined" 
            startIcon={<FilterIcon />}
            onClick={() => setShowFiltros(!showFiltros)}
          >
            Filtros
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Novo Aporte
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      {showFiltros && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Investidor</InputLabel>
                <Select
                  name="investidor_id"
                  value={filtros.investidor_id}
                  onChange={handleFiltroChange}
                  label="Investidor"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {investidores.map((investidor) => (
                    <MenuItem key={investidor.id} value={investidor.id}>
                      {investidor.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data Inicial"
                  value={filtros.data_inicio}
                  onChange={(date) => handleFiltroDateChange('data_inicio', date)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data Final"
                  value={filtros.data_fim}
                  onChange={(date) => handleFiltroDateChange('data_fim', date)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSearch}
                  fullWidth
                >
                  Aplicar
                </Button>
                <Button 
                  variant="outlined"
                  onClick={handleClearFiltros}
                >
                  Limpar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabela de aportes */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Investidor</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && aportes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                  <Typography variant="body2">Carregando aportes...</Typography>
                </TableCell>
              </TableRow>
            ) : aportes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body1" sx={{ my: 2 }}>
                    Nenhum aporte encontrado.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Registrar Aporte
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              aportes.map((aporte) => (
                <TableRow key={aporte.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                      {getNomeInvestidor(aporte.investidor_id)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: 'success.main'
                      }}
                    >
                      {formatarValor(aporte.valor)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {aporte.data ? format(parseISO(aporte.data), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>{aporte.descricao || '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenDialog(aporte)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleOpenDeleteDialog(aporte)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={-1}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Itens por página:"
          labelDisplayedRows={({ from, to }) => `${from}-${to}`}
        />
      </TableContainer>

      {/* Dialog de criação/edição de aporte */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentAporte.id ? 'Editar Aporte' : 'Novo Aporte'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Investidor</InputLabel>
                <Select
                  name="investidor_id"
                  value={currentAporte.investidor_id}
                  onChange={handleInputChange}
                  label="Investidor"
                >
                  {investidores.map((investidor) => (
                    <MenuItem key={investidor.id} value={investidor.id}>
                      {investidor.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor"
                name="valor"
                value={currentAporte.valor}
                onChange={handleInputChange}
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data"
                  value={currentAporte.data}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="descricao"
                value={currentAporte.descricao}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveAporte} 
            variant="contained" 
            color="primary"
            disabled={loading || !currentAporte.investidor_id || !currentAporte.valor}
          >
            {loading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir este aporte de {formatarValor(currentAporte.valor || 0)}?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Atenção: Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button 
            onClick={handleDeleteAporte} 
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

export default Aportes;
