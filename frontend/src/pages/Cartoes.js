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

function Cartoes() {
  // Estados
  const [cartoes, setCartoes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openFaturaDialog, setOpenFaturaDialog] = useState(false);
  const [currentCartao, setCurrentCartao] = useState({
    nome: '',
    limite: '',
    dia_fechamento: 1,
    dia_vencimento: 10,
    cor: '#1976d2'
  });
  const [filtros, setFiltros] = useState({
    busca: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [faturaAtual, setFaturaAtual] = useState({
    cartao: null,
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    despesas: [],
    total: 0
  });
  const [proximasFaturas, setProximasFaturas] = useState([]);

  // Carregar dados iniciais
  useEffect(() => {
    carregarCartoes();
  }, []);

  // Funções para carregar dados
  const carregarCartoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.listarCartoes(filtros);
      setCartoes(response);
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
      setError('Falha ao carregar cartões. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const carregarFatura = async (cartao, mes, ano) => {
    try {
      const response = await api.obterFaturaCartao(cartao.id, mes, ano);
      setFaturaAtual({
        cartao,
        mes,
        ano,
        despesas: response.despesas || [],
        total: response.total || 0
      });
    } catch (error) {
      console.error('Erro ao carregar fatura:', error);
      setError('Falha ao carregar fatura. Verifique sua conexão e tente novamente.');
    }
  };

  const carregarProximasFaturas = async (cartao) => {
    try {
      const response = await api.obterProximasFaturas(cartao.id, 3);
      setProximasFaturas(response);
    } catch (error) {
      console.error('Erro ao carregar próximas faturas:', error);
      setError('Falha ao carregar próximas faturas. Verifique sua conexão e tente novamente.');
    }
  };

  // Funções de manipulação de cartões
  const handleOpenDialog = (cartao = null) => {
    if (cartao) {
      // Editar cartão existente
      setCurrentCartao({
        ...cartao
      });
    } else {
      // Novo cartão
      setCurrentCartao({
        nome: '',
        limite: '',
        dia_fechamento: 1,
        dia_vencimento: 10,
        cor: '#1976d2'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (cartao) => {
    setCurrentCartao(cartao);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleOpenFaturaDialog = async (cartao) => {
    const mes = new Date().getMonth() + 1;
    const ano = new Date().getFullYear();
    await carregarFatura(cartao, mes, ano);
    await carregarProximasFaturas(cartao);
    setOpenFaturaDialog(true);
  };

  const handleCloseFaturaDialog = () => {
    setOpenFaturaDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCartao({
      ...currentCartao,
      [name]: value
    });
  };

  const handleSaveCartao = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cartaoData = {
        ...currentCartao,
        limite: parseFloat(currentCartao.limite),
        dia_fechamento: parseInt(currentCartao.dia_fechamento),
        dia_vencimento: parseInt(currentCartao.dia_vencimento)
      };

      if (currentCartao.id) {
        await api.atualizarCartao(currentCartao.id, cartaoData);
        setSuccess('Cartão atualizado com sucesso!');
      } else {
        await api.criarCartao(cartaoData);
        setSuccess('Cartão criado com sucesso!');
      }

      handleCloseDialog();
      carregarCartoes();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      setError('Falha ao salvar cartão. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCartao = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await api.excluirCartao(currentCartao.id);
      
      setSuccess('Cartão excluído com sucesso!');
      handleCloseDeleteDialog();
      carregarCartoes();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      setError('Falha ao excluir cartão. Verifique se não há despesas associadas a ele.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeFaturaMes = async (mes, ano) => {
    await carregarFatura(faturaAtual.cartao, mes, ano);
  };

  // Funções de filtro
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
  };

  const handleSearch = () => {
    carregarCartoes();
  };

  // Funções auxiliares
  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getNomeMes = (mes) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[mes - 1];
  };

  const calcularProximaData = (dia, tipo) => {
    const hoje = new Date();
    let data = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
    
    // Se o dia já passou este mês, avança para o próximo mês
    if (dia < hoje.getDate()) {
      data = addMonths(data, 1);
    }
    
    return format(data, 'dd/MM/yyyy');
  };

  const calcularUtilizacao = (cartao) => {
    if (!cartao.limite || cartao.limite === 0) return 0;
    const utilizado = cartao.utilizado || 0;
    return (utilizado / cartao.limite) * 100;
  };

  // Renderização
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cartões de Crédito
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

      {/* Barra de ações */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar cartões..."
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
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Novo Cartão
          </Button>
        </Box>
      </Box>

      {/* Grid de cartões */}
      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          </Grid>
        ) : cartoes.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Nenhum cartão cadastrado
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ mt: 2 }}
              >
                Adicionar Cartão
              </Button>
            </Paper>
          </Grid>
        ) : (
          cartoes.map((cartao) => {
            const utilizacao = calcularUtilizacao(cartao);
            return (
              <Grid item xs={12} sm={6} md={4} key={cartao.id}>
                <Card 
                  sx={{ 
                    position: 'relative',
                    borderTop: `4px solid ${cartao.cor || '#1976d2'}`
                  }}
                >
                  <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenDialog(cartao)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleOpenDeleteDialog(cartao)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CreditCardIcon sx={{ mr: 1, color: cartao.cor || '#1976d2' }} />
                      <Typography variant="h6">{cartao.nome}</Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Limite
                        </Typography>
                        <Typography variant="body1">
                          {formatarValor(cartao.limite || 0)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Utilizado
                        </Typography>
                        <Typography variant="body1">
                          {formatarValor(cartao.utilizado || 0)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Fechamento
                        </Typography>
                        <Typography variant="body1">
                          Dia {cartao.dia_fechamento}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Vencimento
                        </Typography>
                        <Typography variant="body1">
                          Dia {cartao.dia_vencimento}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Utilização: {utilizacao.toFixed(0)}%
                      </Typography>
                      <Box 
                        sx={{ 
                          width: '100%', 
                          height: 8, 
                          bgcolor: '#e0e0e0', 
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: `${utilizacao > 100 ? 100 : utilizacao}%`, 
                            height: '100%', 
                            bgcolor: utilizacao > 80 ? '#f44336' : '#4caf50',
                            transition: 'width 0.3s ease'
                          }} 
                        />
                      </Box>
                    </Box>
                    
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      onClick={() => handleOpenFaturaDialog(cartao)}
                    >
                      Ver Fatura Atual
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Dialog de criação/edição de cartão */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentCartao.id ? 'Editar Cartão' : 'Novo Cartão'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Cartão"
                name="nome"
                value={currentCartao.nome}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Limite"
                name="limite"
                value={currentCartao.limite}
                onChange={handleInputChange}
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dia de Fechamento"
                name="dia_fechamento"
                value={currentCartao.dia_fechamento}
                onChange={handleInputChange}
                type="number"
                InputProps={{ inputProps: { min: 1, max: 31 } }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dia de Vencimento"
                name="dia_vencimento"
                value={currentCartao.dia_vencimento}
                onChange={handleInputChange}
                type="number"
                InputProps={{ inputProps: { min: 1, max: 31 } }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cor"
                name="cor"
                value={currentCartao.cor}
                onChange={handleInputChange}
                type="color"
                InputProps={{
                  startAdornment: (
                    <Box 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        bgcolor: currentCartao.cor,
                        mr: 1
                      }} 
                    />
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveCartao} 
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
            Tem certeza que deseja excluir o cartão "{currentCartao.nome}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Atenção: Todas as despesas associadas a este cartão serão desvinculadas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button 
            onClick={handleDeleteCartao} 
            variant="contained" 
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de fatura */}
      <Dialog 
        open={openFaturaDialog} 
        onClose={handleCloseFaturaDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Fatura do Cartão: {faturaAtual.cartao?.nome}
        </DialogTitle>
        <DialogContent>
          {faturaAtual.cartao && (
            <>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  {getNomeMes(faturaAtual.mes)} de {faturaAtual.ano}
                </Typography>
                <Typography variant="h5" color="primary">
                  {formatarValor(faturaAtual.total)}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Próximas Faturas:
                </Typography>
                <Grid container spacing={2}>
                  {proximasFaturas.map((fatura, index) => (
                    <Grid item xs={4} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="body2" color="textSecondary">
                            {getNomeMes(fatura.mes)}/{fatura.ano}
                          </Typography>
                          <Typography variant="h6">
                            {formatarValor(fatura.total)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Despesas desta Fatura:
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Descrição</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Categoria</TableCell>
                      <TableCell>Parcela</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {faturaAtual.despesas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" sx={{ py: 2 }}>
                            Nenhuma despesa nesta fatura
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      faturaAtual.despesas.map((despesa) => (
                        <TableRow key={despesa.id}>
                          <TableCell>{despesa.descricao}</TableCell>
                          <TableCell>{formatarValor(despesa.valor)}</TableCell>
                          <TableCell>
                            {format(parseISO(despesa.data_vencimento), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={despesa.categoria?.nome || 'Sem categoria'} 
                              size="small"
                              style={{ 
                                backgroundColor: despesa.categoria?.cor || '#999',
                                color: '#fff'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {despesa.parcela_atual && despesa.parcelas ? (
                              `${despesa.parcela_atual}/${despesa.parcelas}`
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFaturaDialog}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Cartoes;
