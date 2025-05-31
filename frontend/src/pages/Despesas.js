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
  CreditCard as CreditCardIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ptBR from 'date-fns/locale/pt-BR';
import { format, parseISO, addMonths, isValid } from 'date-fns';
import api from '../services/api';

function Despesas() {
  // Estados
  const [despesas, setDespesas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentDespesa, setCurrentDespesa] = useState({
    descricao: '',
    valor: '',
    data_vencimento: new Date(),
    categoria_id: '',
    cartao_id: '',
    tipo: 'unica',
    recorrente: false,
    parcelada: false,
    parcelas: 1,
    status: 'pendente'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filtros, setFiltros] = useState({
    busca: '',
    categoria_id: '',
    status: '',
    data_inicio: null,
    data_fim: null,
    tipo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [excluirFuturas, setExcluirFuturas] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
  }, []);

  // Função para carregar todos os dados necessários
  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [despesasData, categoriasData, cartoesData, usuariosData] = await Promise.all([
        api.listarDespesas(filtros),
        api.listarCategorias ? api.listarCategorias() : [],
        api.listarCartoes ? api.listarCartoes() : [],
        api.listarUsuarios ? api.listarUsuarios() : []
      ]);
      
      setDespesas(despesasData);
      if (categoriasData) setCategorias(categoriasData);
      if (cartoesData) setCartoes(cartoesData);
      if (usuariosData) setUsuarios(usuariosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Falha ao carregar dados. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // Funções de manipulação de despesas
  const handleOpenDialog = (despesa = null) => {
    if (despesa) {
      // Editar despesa existente
      setCurrentDespesa({
        ...despesa,
        data_vencimento: parseISO(despesa.data_vencimento),
        recorrente: despesa.tipo === 'recorrente',
        parcelada: despesa.tipo === 'parcelada'
      });
    } else {
      // Nova despesa
      setCurrentDespesa({
        descricao: '',
        valor: '',
        data_vencimento: new Date(),
        categoria_id: categorias.length > 0 ? categorias[0].id : '',
        cartao_id: '',
        tipo: 'unica',
        recorrente: false,
        parcelada: false,
        parcelas: 1,
        status: 'pendente'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (despesa) => {
    setCurrentDespesa(despesa);
    setExcluirFuturas(false);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDespesa({
      ...currentDespesa,
      [name]: value
    });
  };

  const handleDateChange = (date) => {
    if (isValid(date)) {
      setCurrentDespesa({
        ...currentDespesa,
        data_vencimento: date
      });
    }
  };

  const handleTipoChange = (e) => {
    const { name, checked } = e.target;
    
    if (name === 'recorrente' && checked) {
      setCurrentDespesa({
        ...currentDespesa,
        recorrente: true,
        parcelada: false,
        tipo: 'recorrente',
        parcelas: 1
      });
    } else if (name === 'parcelada' && checked) {
      setCurrentDespesa({
        ...currentDespesa,
        recorrente: false,
        parcelada: true,
        tipo: 'parcelada',
        parcelas: 2
      });
    } else {
      setCurrentDespesa({
        ...currentDespesa,
        recorrente: false,
        parcelada: false,
        tipo: 'unica',
        parcelas: 1
      });
    }
  };

  const handleSaveDespesa = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Preparar dados para envio
      const despesaData = {
        ...currentDespesa,
        valor: parseFloat(currentDespesa.valor),
        tipo: currentDespesa.recorrente ? 'recorrente' : (currentDespesa.parcelada ? 'parcelada' : 'unica'),
        data_vencimento: format(currentDespesa.data_vencimento, 'yyyy-MM-dd')
      };

      if (currentDespesa.id) {
        await api.atualizarDespesa(currentDespesa.id, despesaData);
        setSuccess('Despesa atualizada com sucesso!');
      } else {
        await api.criarDespesa(despesaData);
        setSuccess('Despesa criada com sucesso!');
      }

      handleCloseDialog();
      carregarDados();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      setError('Falha ao salvar despesa. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDespesa = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await api.excluirDespesa(currentDespesa.id, excluirFuturas);
      
      setSuccess('Despesa excluída com sucesso!');
      handleCloseDeleteDialog();
      carregarDados();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      setError('Falha ao excluir despesa. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Funções de paginação
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
    setFiltros({
      ...filtros,
      [name]: date
    });
  };

  const handleSearch = () => {
    setPage(0);
    carregarDados();
  };

  const handleResetFiltros = () => {
    setFiltros({
      busca: '',
      categoria_id: '',
      status: '',
      data_inicio: null,
      data_fim: null,
      tipo: ''
    });
    setPage(0);
  };

  // Funções auxiliares
  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data) => {
    if (!data) return '-';
    try {
      return format(parseISO(data), 'dd/MM/yyyy');
    } catch (error) {
      return data;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pago':
        return 'success';
      case 'pendente':
        return 'warning';
      case 'atrasado':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTipoLabel = (tipo, parcela_atual, parcelas) => {
    switch (tipo) {
      case 'recorrente':
        return 'Recorrente';
      case 'parcelada':
        return `Parcelada (${parcela_atual}/${parcelas})`;
      default:
        return 'Única';
    }
  };

  // Renderização
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gerenciamento de Despesas
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

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Buscar despesas"
              name="busca"
              value={filtros.busca}
              onChange={handleFiltroChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoria</InputLabel>
              <Select
                name="categoria_id"
                value={filtros.categoria_id}
                onChange={handleFiltroChange}
                label="Categoria"
              >
                <MenuItem value="">Todas</MenuItem>
                {categorias.map((categoria) => (
                  <MenuItem key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filtros.status}
                onChange={handleFiltroChange}
                label="Status"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pendente">Pendente</MenuItem>
                <MenuItem value="pago">Pago</MenuItem>
                <MenuItem value="atrasado">Atrasado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                name="tipo"
                value={filtros.tipo}
                onChange={handleFiltroChange}
                label="Tipo"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="unica">Única</MenuItem>
                <MenuItem value="recorrente">Recorrente</MenuItem>
                <MenuItem value="parcelada">Parcelada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data Início"
                value={filtros.data_inicio}
                onChange={(date) => handleFiltroDateChange('data_inicio', date)}
                renderInput={(params) => <TextField size="small" {...params} fullWidth />}
                format="dd/MM/yyyy"
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data Fim"
                value={filtros.data_fim}
                onChange={(date) => handleFiltroDateChange('data_fim', date)}
                renderInput={(params) => <TextField size="small" {...params} fullWidth />}
                format="dd/MM/yyyy"
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              fullWidth
            >
              Filtrar
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Button 
              variant="outlined" 
              onClick={handleResetFiltros}
              startIcon={<RefreshIcon />}
              fullWidth
            >
              Limpar
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={12} md={8}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              fullWidth
            >
              Nova Despesa
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela de Despesas */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Descrição</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Método</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && despesas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                  <Typography variant="body2">Carregando despesas...</Typography>
                </TableCell>
              </TableRow>
            ) : despesas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" sx={{ my: 2 }}>
                    Nenhuma despesa encontrada.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Adicionar Despesa
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              despesas
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((despesa) => (
                  <TableRow key={despesa.id}>
                    <TableCell>{despesa.descricao}</TableCell>
                    <TableCell>{formatarValor(despesa.valor)}</TableCell>
                    <TableCell>{formatarData(despesa.data_vencimento)}</TableCell>
                    <TableCell>
                      {despesa.categoria ? (
                        <Chip 
                          label={despesa.categoria.nome} 
                          size="small"
                          style={{ 
                            backgroundColor: despesa.categoria.cor || '#1976d2',
                            color: '#fff'
                          }}
                        />
                      ) : (
                        'Sem categoria'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={despesa.status.charAt(0).toUpperCase() + despesa.status.slice(1)} 
                        color={getStatusColor(despesa.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {getTipoLabel(despesa.tipo, despesa.parcela_atual, despesa.parcelas)}
                    </TableCell>
                    <TableCell>
                      {despesa.cartao ? (
                        <Tooltip title={`Cartão: ${despesa.cartao.nome}`}>
                          <Chip 
                            icon={<CreditCardIcon />} 
                            label={despesa.cartao.nome.substring(0, 10) + (despesa.cartao.nome.length > 10 ? '...' : '')} 
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      ) : (
                        <Chip 
                          icon={<MoneyIcon />} 
                          label="Dinheiro" 
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleOpenDialog(despesa)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleOpenDeleteDialog(despesa)}
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={despesas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Itens por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>

      {/* Dialog de criação/edição de despesa */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentDespesa.id ? 'Editar Despesa' : 'Nova Despesa'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="descricao"
                value={currentDespesa.descricao}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor"
                name="valor"
                value={currentDespesa.valor}
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
                  label="Data de Vencimento"
                  value={currentDespesa.data_vencimento}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  format="dd/MM/yyyy"
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  name="categoria_id"
                  value={currentDespesa.categoria_id}
                  onChange={handleInputChange}
                  label="Categoria"
                  required
                >
                  {categorias.map((categoria) => (
                    <MenuItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Método de Pagamento</InputLabel>
                <Select
                  name="cartao_id"
                  value={currentDespesa.cartao_id}
                  onChange={handleInputChange}
                  label="Método de Pagamento"
                >
                  <MenuItem value="">Dinheiro/Pix</MenuItem>
                  {cartoes.map((cartao) => (
                    <MenuItem key={cartao.id} value={cartao.id}>
                      Cartão: {cartao.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={currentDespesa.status}
                  onChange={handleInputChange}
                  label="Status"
                  required
                >
                  <MenuItem value="pendente">Pendente</MenuItem>
                  <MenuItem value="pago">Pago</MenuItem>
                  <MenuItem value="atrasado">Atrasado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tipo de Despesa
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!currentDespesa.recorrente && !currentDespesa.parcelada}
                        onChange={() => setCurrentDespesa({
                          ...currentDespesa,
                          recorrente: false,
                          parcelada: false,
                          tipo: 'unica',
                          parcelas: 1
                        })}
                        name="unica"
                      />
                    }
                    label="Única"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentDespesa.recorrente}
                        onChange={handleTipoChange}
                        name="recorrente"
                      />
                    }
                    label="Recorrente"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentDespesa.parcelada}
                        onChange={handleTipoChange}
                        name="parcelada"
                      />
                    }
                    label="Parcelada"
                  />
                </Box>
              </Box>
            </Grid>
            
            {currentDespesa.parcelada && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Número de Parcelas"
                  name="parcelas"
                  value={currentDespesa.parcelas}
                  onChange={handleInputChange}
                  type="number"
                  InputProps={{ inputProps: { min: 2, max: 48 } }}
                  required
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveDespesa} 
            variant="contained" 
            color="primary"
            disabled={loading}
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
            Tem certeza que deseja excluir a despesa "{currentDespesa.descricao}"?
          </Typography>
          
          {currentDespesa.tipo === 'recorrente' && (
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={excluirFuturas}
                    onChange={(e) => setExcluirFuturas(e.target.checked)}
                  />
                }
                label="Excluir também despesas futuras desta recorrência"
              />
            </Box>
          )}
          
          {currentDespesa.tipo === 'parcelada' && currentDespesa.parcela_atual < currentDespesa.parcelas && (
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={excluirFuturas}
                    onChange={(e) => setExcluirFuturas(e.target.checked)}
                  />
                }
                label="Excluir também parcelas futuras"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button 
            onClick={handleDeleteDespesa} 
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

export default Despesas;
