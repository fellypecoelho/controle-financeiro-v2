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
  Event as EventIcon,
  Today as TodayIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  FilterList as FilterIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ptBR from 'date-fns/locale/pt-BR';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDay,
  isToday,
  isValid
} from 'date-fns';
import api from '../services/api';

function Calendario() {
  // Estados
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [currentEvento, setCurrentEvento] = useState({
    titulo: '',
    data: new Date(),
    tipo: 'despesa',
    valor: '',
    descricao: '',
    id_referencia: null
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayEventos, setDayEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    categoria_id: '',
    cartao_id: ''
  });
  const [showFiltros, setShowFiltros] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [cartoes, setCartoes] = useState([]);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  // Atualizar calendário quando a data atual mudar
  useEffect(() => {
    gerarDiasCalendario();
    carregarEventos();
  }, [currentDate, filtros]);

  // Funções para carregar dados
  const carregarDadosIniciais = async () => {
    setLoading(true);
    setError(null);
    try {
      // Carregar categorias
      const categoriasData = await api.listarCategorias();
      setCategorias(categoriasData || []);
      
      // Carregar cartões
      const cartoesData = await api.listarCartoes();
      setCartoes(cartoesData || []);
      
      // Gerar dias do calendário
      gerarDiasCalendario();
      
      // Carregar eventos
      await carregarEventos();
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      setError('Falha ao carregar dados. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const carregarEventos = async () => {
    try {
      setLoading(true);
      
      const inicio = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const fim = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      
      const params = {
        data_inicio: inicio,
        data_fim: fim,
        ...filtros
      };
      
      const response = await api.listarEventosCalendario(params);
      setEventos(response || []);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      setError('Falha ao carregar eventos. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Funções para manipulação do calendário
  const gerarDiasCalendario = () => {
    const inicio = startOfMonth(currentDate);
    const fim = endOfMonth(currentDate);
    
    // Obter todos os dias do mês
    const diasDoMes = eachDayOfInterval({ start: inicio, end: fim });
    
    // Determinar o dia da semana do primeiro dia (0 = domingo, 1 = segunda, etc.)
    const primeiroDiaSemana = getDay(inicio);
    
    // Adicionar dias vazios no início para alinhar com o dia da semana
    const diasVaziosInicio = Array(primeiroDiaSemana).fill(null);
    
    // Calcular quantos dias vazios precisamos no final para completar a grade
    const totalDias = diasVaziosInicio.length + diasDoMes.length;
    const diasRestantes = 42 - totalDias; // 6 semanas x 7 dias = 42
    const diasVaziosFim = Array(diasRestantes > 0 ? diasRestantes : 0).fill(null);
    
    // Combinar todos os dias
    const todosDias = [...diasVaziosInicio, ...diasDoMes, ...diasVaziosFim];
    
    setCalendarDays(todosDias);
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  // Funções para manipulação de eventos
  const handleDayClick = (day) => {
    if (!day) return;
    
    setSelectedDay(day);
    
    // Filtrar eventos para o dia selecionado
    const eventosNoDia = eventos.filter(evento => {
      const dataEvento = parseISO(evento.data);
      return isSameDay(dataEvento, day);
    });
    
    setDayEventos(eventosNoDia);
    setOpenViewDialog(true);
  };

  const handleOpenDialog = (day = null, evento = null) => {
    if (evento) {
      // Editar evento existente
      setCurrentEvento({
        ...evento,
        data: parseISO(evento.data)
      });
    } else {
      // Novo evento
      setCurrentEvento({
        titulo: '',
        data: day || new Date(),
        tipo: 'despesa',
        valor: '',
        descricao: '',
        id_referencia: null
      });
    }
    
    setOpenDialog(true);
    if (openViewDialog) setOpenViewDialog(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedDay(null);
    setDayEventos([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEvento({
      ...currentEvento,
      [name]: value
    });
  };

  const handleDateChange = (date) => {
    if (isValid(date)) {
      setCurrentEvento({
        ...currentEvento,
        data: date
      });
    }
  };

  const handleSaveEvento = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const eventoData = {
        ...currentEvento,
        data: format(currentEvento.data, 'yyyy-MM-dd'),
        valor: currentEvento.valor ? parseFloat(currentEvento.valor) : 0
      };

      if (currentEvento.id) {
        await api.atualizarEvento(currentEvento.id, eventoData);
        setSuccess('Evento atualizado com sucesso!');
      } else {
        await api.criarEvento(eventoData);
        setSuccess('Evento criado com sucesso!');
      }

      handleCloseDialog();
      carregarEventos();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      setError('Falha ao salvar evento. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvento = async (evento) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.excluirEvento(evento.id);
      
      setSuccess('Evento excluído com sucesso!');
      
      // Atualizar lista de eventos do dia
      const eventosAtualizados = dayEventos.filter(e => e.id !== evento.id);
      setDayEventos(eventosAtualizados);
      
      // Recarregar todos os eventos
      carregarEventos();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      setError('Falha ao excluir evento. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Funções de filtro
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
  };

  // Funções auxiliares
  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getEventosPorDia = (day) => {
    if (!day) return [];
    
    return eventos.filter(evento => {
      const dataEvento = parseISO(evento.data);
      return isSameDay(dataEvento, day);
    });
  };

  const getCorPorTipo = (tipo) => {
    switch (tipo) {
      case 'despesa':
        return '#f44336'; // Vermelho
      case 'aporte':
        return '#4caf50'; // Verde
      case 'fatura':
        return '#ff9800'; // Laranja
      case 'lembrete':
        return '#2196f3'; // Azul
      default:
        return '#9e9e9e'; // Cinza
    }
  };

  const getNomeTipo = (tipo) => {
    switch (tipo) {
      case 'despesa':
        return 'Despesa';
      case 'aporte':
        return 'Aporte';
      case 'fatura':
        return 'Fatura';
      case 'lembrete':
        return 'Lembrete';
      default:
        return 'Evento';
    }
  };

  const getNomeCategoria = (id) => {
    const categoria = categorias.find(cat => cat.id === id);
    return categoria ? categoria.nome : 'Sem categoria';
  };

  const getNomeCartao = (id) => {
    const cartao = cartoes.find(card => card.id === id);
    return cartao ? cartao.nome : 'Sem cartão';
  };

  // Renderização
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Calendário Financeiro
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
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handlePrevMonth}>
            <NavigateBeforeIcon />
          </IconButton>
          
          <Typography variant="h6">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </Typography>
          
          <IconButton onClick={handleNextMonth}>
            <NavigateNextIcon />
          </IconButton>
          
          <Button 
            variant="outlined" 
            startIcon={<TodayIcon />}
            onClick={handleTodayClick}
            size="small"
          >
            Hoje
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
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
            Novo Evento
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      {showFiltros && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  name="tipo"
                  value={filtros.tipo}
                  onChange={handleFiltroChange}
                  label="Tipo"
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="despesa">Despesas</MenuItem>
                  <MenuItem value="aporte">Aportes</MenuItem>
                  <MenuItem value="fatura">Faturas</MenuItem>
                  <MenuItem value="lembrete">Lembretes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  name="categoria_id"
                  value={filtros.categoria_id}
                  onChange={handleFiltroChange}
                  label="Categoria"
                  disabled={filtros.tipo !== 'todos' && filtros.tipo !== 'despesa'}
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
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Cartão</InputLabel>
                <Select
                  name="cartao_id"
                  value={filtros.cartao_id}
                  onChange={handleFiltroChange}
                  label="Cartão"
                  disabled={filtros.tipo !== 'todos' && filtros.tipo !== 'despesa' && filtros.tipo !== 'fatura'}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {cartoes.map((cartao) => (
                    <MenuItem key={cartao.id} value={cartao.id}>
                      {cartao.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Calendário */}
      <Paper sx={{ p: 2, mb: 3 }}>
        {/* Cabeçalho dos dias da semana */}
        <Grid container>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
            <Grid 
              item 
              xs={12/7} 
              key={index}
              sx={{ 
                textAlign: 'center', 
                p: 1,
                fontWeight: 'bold',
                borderBottom: 1,
                borderColor: 'divider'
              }}
            >
              {day}
            </Grid>
          ))}
        </Grid>
        
        {/* Dias do calendário */}
        <Grid container>
          {calendarDays.map((day, index) => {
            const eventosNoDia = day ? getEventosPorDia(day) : [];
            const isCurrentMonth = day ? isSameMonth(day, currentDate) : false;
            const isCurrentDay = day ? isToday(day) : false;
            
            return (
              <Grid 
                item 
                xs={12/7} 
                key={index}
                sx={{ 
                  height: 120,
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 1,
                  position: 'relative',
                  bgcolor: isCurrentDay ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                  opacity: isCurrentMonth ? 1 : 0.5,
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                    cursor: 'pointer'
                  }
                }}
                onClick={() => day && handleDayClick(day)}
              >
                {day && (
                  <>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isCurrentDay ? 'bold' : 'normal',
                        color: isCurrentDay ? 'primary.main' : 'text.primary'
                      }}
                    >
                      {format(day, 'd')}
                    </Typography>
                    
                    <Box sx={{ mt: 1, overflow: 'hidden' }}>
                      {eventosNoDia.slice(0, 3).map((evento, idx) => (
                        <Box 
                          key={idx}
                          sx={{ 
                            bgcolor: getCorPorTipo(evento.tipo),
                            color: 'white',
                            p: 0.5,
                            borderRadius: 1,
                            mb: 0.5,
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {evento.titulo}
                        </Box>
                      ))}
                      
                      {eventosNoDia.length > 3 && (
                        <Typography variant="caption" color="text.secondary">
                          +{eventosNoDia.length - 3} mais
                        </Typography>
                      )}
                    </Box>
                  </>
                )}
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Dialog de visualização de eventos do dia */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedDay && format(selectedDay, 'dd/MM/yyyy')}
        </DialogTitle>
        <DialogContent>
          {dayEventos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body1" gutterBottom>
                Nenhum evento neste dia
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog(selectedDay)}
                sx={{ mt: 1 }}
              >
                Adicionar Evento
              </Button>
            </Box>
          ) : (
            <Box>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog(selectedDay)}
                sx={{ mb: 2 }}
                fullWidth
              >
                Adicionar Evento
              </Button>
              
              {dayEventos.map((evento, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6">{evento.titulo}</Typography>
                        <Chip 
                          label={getNomeTipo(evento.tipo)} 
                          size="small"
                          sx={{ 
                            bgcolor: getCorPorTipo(evento.tipo),
                            color: 'white',
                            mb: 1
                          }}
                        />
                      </Box>
                      <Box>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenDialog(null, evento)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteEvento(evento)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {evento.valor > 0 && (
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        {formatarValor(evento.valor)}
                      </Typography>
                    )}
                    
                    {evento.descricao && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {evento.descricao}
                      </Typography>
                    )}
                    
                    {evento.categoria_id && (
                      <Typography variant="body2" color="text.secondary">
                        Categoria: {getNomeCategoria(evento.categoria_id)}
                      </Typography>
                    )}
                    
                    {evento.cartao_id && (
                      <Typography variant="body2" color="text.secondary">
                        Cartão: {getNomeCartao(evento.cartao_id)}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de criação/edição de evento */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentEvento.id ? 'Editar Evento' : 'Novo Evento'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                name="titulo"
                value={currentEvento.titulo}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data"
                  value={currentEvento.data}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo</InputLabel>
                <Select
                  name="tipo"
                  value={currentEvento.tipo}
                  onChange={handleInputChange}
                  label="Tipo"
                >
                  <MenuItem value="despesa">Despesa</MenuItem>
                  <MenuItem value="aporte">Aporte</MenuItem>
                  <MenuItem value="fatura">Fatura</MenuItem>
                  <MenuItem value="lembrete">Lembrete</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {(currentEvento.tipo === 'despesa' || currentEvento.tipo === 'aporte') && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Valor"
                  name="valor"
                  value={currentEvento.valor}
                  onChange={handleInputChange}
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                />
              </Grid>
            )}
            
            {currentEvento.tipo === 'despesa' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    name="categoria_id"
                    value={currentEvento.categoria_id || ''}
                    onChange={handleInputChange}
                    label="Categoria"
                  >
                    <MenuItem value="">Sem categoria</MenuItem>
                    {categorias.map((categoria) => (
                      <MenuItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {(currentEvento.tipo === 'despesa' || currentEvento.tipo === 'fatura') && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Cartão</InputLabel>
                  <Select
                    name="cartao_id"
                    value={currentEvento.cartao_id || ''}
                    onChange={handleInputChange}
                    label="Cartão"
                  >
                    <MenuItem value="">Sem cartão</MenuItem>
                    {cartoes.map((cartao) => (
                      <MenuItem key={cartao.id} value={cartao.id}>
                        {cartao.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="descricao"
                value={currentEvento.descricao}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveEvento} 
            variant="contained" 
            color="primary"
            disabled={loading || !currentEvento.titulo}
          >
            {loading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Calendario;
