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
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
  Tabs
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
  Category as CategoryIcon,
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ptBR from 'date-fns/locale/pt-BR';
import { format, parseISO, addMonths, isValid, subMonths } from 'date-fns';
import api from '../services/api';

// Importação de componentes de gráficos
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

function Relatorios() {
  // Estados
  const [tabValue, setTabValue] = useState(0);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
  const [dataInicio, setDataInicio] = useState(subMonths(new Date(), 5));
  const [dataFim, setDataFim] = useState(new Date());
  const [categoriaId, setCategoriaId] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [tipoGrafico, setTipoGrafico] = useState('bar');
  
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  const [dadosGraficoCategorias, setDadosGraficoCategorias] = useState(null);
  const [dadosGraficoEvolucao, setDadosGraficoEvolucao] = useState(null);
  const [dadosGraficoComparativo, setDadosGraficoComparativo] = useState(null);
  const [dadosResumoMensal, setDadosResumoMensal] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cores para gráficos
  const coresPadrao = [
    '#1976d2', '#2196f3', '#64b5f6', '#90caf9', '#42a5f5',
    '#4caf50', '#81c784', '#66bb6a', '#a5d6a7', '#388e3c',
    '#f44336', '#e57373', '#ef5350', '#ffcdd2', '#d32f2f',
    '#ff9800', '#ffb74d', '#ffa726', '#ffe0b2', '#f57c00',
    '#9c27b0', '#ba68c8', '#ab47bc', '#e1bee7', '#7b1fa2'
  ];

  // Carregar dados iniciais
  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  // Carregar dados quando os filtros mudarem
  useEffect(() => {
    if (tabValue === 0) {
      carregarDadosGraficoCategorias();
    } else if (tabValue === 1) {
      carregarDadosGraficoEvolucao();
    } else if (tabValue === 2) {
      carregarDadosGraficoComparativo();
    } else if (tabValue === 3) {
      carregarDadosResumoMensal();
    }
  }, [tabValue, periodoSelecionado, dataInicio, dataFim, categoriaId, usuarioId, tipoGrafico]);

  // Função para carregar dados iniciais
  const carregarDadosIniciais = async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriasData, usuariosData] = await Promise.all([
        api.listarCategorias ? api.listarCategorias() : [],
        api.listarUsuarios ? api.listarUsuarios() : []
      ]);
      
      if (categoriasData) setCategorias(categoriasData);
      if (usuariosData) setUsuarios(usuariosData);
      
      // Carregar dados do primeiro gráfico
      await carregarDadosGraficoCategorias();
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      setError('Falha ao carregar dados. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar dados do gráfico de categorias
  const carregarDadosGraficoCategorias = async () => {
    setLoading(true);
    setError(null);
    try {
      // Formatar datas para a API
      const dataInicioFormatada = format(dataInicio, 'yyyy-MM-dd');
      const dataFimFormatada = format(dataFim, 'yyyy-MM-dd');
      
      // Parâmetros para a API
      const params = {
        data_inicio: dataInicioFormatada,
        data_fim: dataFimFormatada,
        categoria_id: categoriaId || undefined,
        usuario_id: usuarioId || undefined
      };
      
      // Chamada à API
      const response = await api.obterDespesasPorCategoria(params);
      
      if (response && response.length > 0) {
        // Preparar dados para o gráfico
        const labels = response.map(item => item.categoria ? item.categoria.nome : 'Sem categoria');
        const data = response.map(item => item.total);
        const backgroundColor = response.map((item, index) => 
          item.categoria && item.categoria.cor ? item.categoria.cor : coresPadrao[index % coresPadrao.length]
        );
        
        setDadosGraficoCategorias({
          labels,
          datasets: [
            {
              label: 'Despesas por Categoria',
              data,
              backgroundColor,
              borderColor: backgroundColor.map(cor => cor),
              borderWidth: 1
            }
          ]
        });
      } else {
        setDadosGraficoCategorias(null);
        setError('Nenhum dado encontrado para o período selecionado.');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico de categorias:', error);
      setError('Falha ao carregar dados do gráfico. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar dados do gráfico de evolução
  const carregarDadosGraficoEvolucao = async () => {
    setLoading(true);
    setError(null);
    try {
      // Formatar datas para a API
      const dataInicioFormatada = format(dataInicio, 'yyyy-MM-dd');
      const dataFimFormatada = format(dataFim, 'yyyy-MM-dd');
      
      // Parâmetros para a API
      const params = {
        data_inicio: dataInicioFormatada,
        data_fim: dataFimFormatada,
        categoria_id: categoriaId || undefined,
        usuario_id: usuarioId || undefined,
        periodo: periodoSelecionado // 'dia', 'semana', 'mes', 'ano'
      };
      
      // Chamada à API
      const response = await api.obterEvolucaoDespesas(params);
      
      if (response && response.length > 0) {
        // Preparar dados para o gráfico
        const labels = response.map(item => item.periodo);
        const data = response.map(item => item.total);
        
        setDadosGraficoEvolucao({
          labels,
          datasets: [
            {
              label: 'Evolução de Despesas',
              data,
              fill: true,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              tension: 0.4
            }
          ]
        });
      } else {
        setDadosGraficoEvolucao(null);
        setError('Nenhum dado encontrado para o período selecionado.');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico de evolução:', error);
      setError('Falha ao carregar dados do gráfico. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar dados do gráfico comparativo
  const carregarDadosGraficoComparativo = async () => {
    setLoading(true);
    setError(null);
    try {
      // Formatar datas para a API
      const dataInicioFormatada = format(dataInicio, 'yyyy-MM-dd');
      const dataFimFormatada = format(dataFim, 'yyyy-MM-dd');
      
      // Parâmetros para a API
      const params = {
        data_inicio: dataInicioFormatada,
        data_fim: dataFimFormatada,
        categoria_id: categoriaId || undefined,
        usuario_id: usuarioId || undefined
      };
      
      // Chamada à API
      const response = await api.obterComparativoDespesasAportes(params);
      
      if (response) {
        // Preparar dados para o gráfico
        const labels = ['Despesas', 'Aportes', 'Saldo'];
        const data = [
          response.total_despesas || 0,
          response.total_aportes || 0,
          (response.total_aportes || 0) - (response.total_despesas || 0)
        ];
        
        setDadosGraficoComparativo({
          labels,
          datasets: [
            {
              label: 'Comparativo Financeiro',
              data,
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                data[2] >= 0 ? 'rgba(54, 162, 235, 0.6)' : 'rgba(255, 159, 64, 0.6)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(75, 192, 192, 1)',
                data[2] >= 0 ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }
          ]
        });
      } else {
        setDadosGraficoComparativo(null);
        setError('Nenhum dado encontrado para o período selecionado.');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico comparativo:', error);
      setError('Falha ao carregar dados do gráfico. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar dados do resumo mensal
  const carregarDadosResumoMensal = async () => {
    setLoading(true);
    setError(null);
    try {
      // Formatar datas para a API
      const dataInicioFormatada = format(dataInicio, 'yyyy-MM-dd');
      const dataFimFormatada = format(dataFim, 'yyyy-MM-dd');
      
      // Parâmetros para a API
      const params = {
        data_inicio: dataInicioFormatada,
        data_fim: dataFimFormatada,
        usuario_id: usuarioId || undefined
      };
      
      // Chamada à API
      const response = await api.obterResumoMensal(params);
      
      if (response) {
        setDadosResumoMensal(response);
      } else {
        setDadosResumoMensal(null);
        setError('Nenhum dado encontrado para o período selecionado.');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do resumo mensal:', error);
      setError('Falha ao carregar dados do resumo. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para exportar relatório
  const exportarRelatorio = () => {
    // Implementação da exportação de relatório (PDF, Excel, etc.)
    alert('Funcionalidade de exportação em desenvolvimento');
  };

  // Função para imprimir relatório
  const imprimirRelatorio = () => {
    window.print();
  };

  // Funções auxiliares
  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Opções de configuração dos gráficos
  const opcoesGraficoPizza = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Despesas por Categoria',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${formatarValor(value)}`;
          }
        }
      }
    }
  };

  const opcoesGraficoLinha = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Evolução de Despesas',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${formatarValor(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatarValor(value);
          }
        }
      }
    }
  };

  const opcoesGraficoBarra = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Comparativo Financeiro',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${formatarValor(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatarValor(value);
          }
        }
      }
    }
  };

  // Renderização
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Relatórios Financeiros
      </Typography>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data Início"
                value={dataInicio}
                onChange={(date) => setDataInicio(date)}
                renderInput={(params) => <TextField size="small" {...params} fullWidth />}
                format="dd/MM/yyyy"
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data Fim"
                value={dataFim}
                onChange={(date) => setDataFim(date)}
                renderInput={(params) => <TextField size="small" {...params} fullWidth />}
                format="dd/MM/yyyy"
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoria</InputLabel>
              <Select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
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
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Usuário</InputLabel>
              <Select
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                label="Usuário"
              >
                <MenuItem value="">Todos</MenuItem>
                {usuarios.map((usuario) => (
                  <MenuItem key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {tabValue === 1 && (
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Agrupar por</InputLabel>
                <Select
                  value={periodoSelecionado}
                  onChange={(e) => setPeriodoSelecionado(e.target.value)}
                  label="Agrupar por"
                >
                  <MenuItem value="dia">Dia</MenuItem>
                  <MenuItem value="semana">Semana</MenuItem>
                  <MenuItem value="mes">Mês</MenuItem>
                  <MenuItem value="ano">Ano</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
          
          {(tabValue === 0 || tabValue === 1) && (
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Gráfico</InputLabel>
                <Select
                  value={tipoGrafico}
                  onChange={(e) => setTipoGrafico(e.target.value)}
                  label="Tipo de Gráfico"
                >
                  <MenuItem value="bar">Barras</MenuItem>
                  <MenuItem value="line">Linha</MenuItem>
                  <MenuItem value="pie">Pizza</MenuItem>
                  <MenuItem value="doughnut">Rosca</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
          
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              onClick={exportarRelatorio}
              fullWidth
            >
              Exportar
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              startIcon={<PrintIcon />}
              onClick={imprimirRelatorio}
              fullWidth
            >
              Imprimir
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs de Relatórios */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="relatórios tabs">
          <Tab label="Despesas por Categoria" />
          <Tab label="Evolução de Despesas" />
          <Tab label="Comparativo Financeiro" />
          <Tab label="Resumo Mensal" />
        </Tabs>
      </Box>

      {/* Conteúdo das Tabs */}
      <Box sx={{ mt: 2 }}>
        {/* Tab 1: Despesas por Categoria */}
        {tabValue === 0 && (
          <Paper sx={{ p: 2, height: 500 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : dadosGraficoCategorias ? (
              <Box sx={{ height: '100%' }}>
                {tipoGrafico === 'bar' && <Bar data={dadosGraficoCategorias} options={opcoesGraficoBarra} />}
                {tipoGrafico === 'line' && <Line data={dadosGraficoCategorias} options={opcoesGraficoLinha} />}
                {tipoGrafico === 'pie' && <Pie data={dadosGraficoCategorias} options={opcoesGraficoPizza} />}
                {tipoGrafico === 'doughnut' && <Doughnut data={dadosGraficoCategorias} options={opcoesGraficoPizza} />}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="textSecondary">
                  Nenhum dado disponível para o período selecionado.
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        {/* Tab 2: Evolução de Despesas */}
        {tabValue === 1 && (
          <Paper sx={{ p: 2, height: 500 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : dadosGraficoEvolucao ? (
              <Box sx={{ height: '100%' }}>
                {tipoGrafico === 'bar' && <Bar data={dadosGraficoEvolucao} options={opcoesGraficoBarra} />}
                {tipoGrafico === 'line' && <Line data={dadosGraficoEvolucao} options={opcoesGraficoLinha} />}
                {tipoGrafico === 'pie' && <Pie data={dadosGraficoEvolucao} options={opcoesGraficoPizza} />}
                {tipoGrafico === 'doughnut' && <Doughnut data={dadosGraficoEvolucao} options={opcoesGraficoPizza} />}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="textSecondary">
                  Nenhum dado disponível para o período selecionado.
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        {/* Tab 3: Comparativo Financeiro */}
        {tabValue === 2 && (
          <Paper sx={{ p: 2, height: 500 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : dadosGraficoComparativo ? (
              <Box sx={{ height: '100%' }}>
                <Bar data={dadosGraficoComparativo} options={opcoesGraficoBarra} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="textSecondary">
                  Nenhum dado disponível para o período selecionado.
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        {/* Tab 4: Resumo Mensal */}
        {tabValue === 3 && (
          <Paper sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
              </Box>
            ) : dadosResumoMensal ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Resumo Financeiro
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Total de Despesas:
                          </Typography>
                          <Typography variant="h6" color="error">
                            {formatarValor(dadosResumoMensal.total_despesas || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Total de Aportes:
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            {formatarValor(dadosResumoMensal.total_aportes || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Saldo:
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={dadosResumoMensal.saldo >= 0 ? 'primary' : 'error'}
                          >
                            {formatarValor(dadosResumoMensal.saldo || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Economia:
                          </Typography>
                          <Typography variant="h6">
                            {dadosResumoMensal.total_aportes > 0 
                              ? `${Math.round((dadosResumoMensal.saldo / dadosResumoMensal.total_aportes) * 100)}%` 
                              : '0%'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Maiores Despesas
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      {dadosResumoMensal.maiores_despesas && dadosResumoMensal.maiores_despesas.length > 0 ? (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Descrição</TableCell>
                                <TableCell>Categoria</TableCell>
                                <TableCell align="right">Valor</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {dadosResumoMensal.maiores_despesas.map((despesa) => (
                                <TableRow key={despesa.id}>
                                  <TableCell>{despesa.descricao}</TableCell>
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
                                  <TableCell align="right">{formatarValor(despesa.valor)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                          Nenhuma despesa registrada no período.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Despesas por Usuário
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      {dadosResumoMensal.despesas_por_usuario && dadosResumoMensal.despesas_por_usuario.length > 0 ? (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Usuário</TableCell>
                                <TableCell align="right">Total de Despesas</TableCell>
                                <TableCell align="right">Total de Aportes</TableCell>
                                <TableCell align="right">Saldo</TableCell>
                                <TableCell align="right">Participação</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {dadosResumoMensal.despesas_por_usuario.map((item) => (
                                <TableRow key={item.usuario_id}>
                                  <TableCell>{item.usuario_nome}</TableCell>
                                  <TableCell align="right">{formatarValor(item.total_despesas)}</TableCell>
                                  <TableCell align="right">{formatarValor(item.total_aportes)}</TableCell>
                                  <TableCell align="right">
                                    <Typography 
                                      color={item.saldo >= 0 ? 'primary' : 'error'}
                                    >
                                      {formatarValor(item.saldo)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    {dadosResumoMensal.total_despesas > 0 
                                      ? `${Math.round((item.total_despesas / dadosResumoMensal.total_despesas) * 100)}%` 
                                      : '0%'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                          Nenhum dado de usuário disponível para o período.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography variant="body1" color="textSecondary">
                  Nenhum dado disponível para o período selecionado.
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default Relatorios;
