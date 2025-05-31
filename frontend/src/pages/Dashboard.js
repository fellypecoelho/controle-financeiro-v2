import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider,
  CircularProgress,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { 
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import api from '../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumo, setResumo] = useState(null);
  const [evolucao, setEvolucao] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  const meses = [
    { valor: 1, nome: 'Janeiro' },
    { valor: 2, nome: 'Fevereiro' },
    { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' },
    { valor: 5, nome: 'Maio' },
    { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' },
    { valor: 8, nome: 'Agosto' },
    { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' },
    { valor: 11, nome: 'Novembro' },
    { valor: 12, nome: 'Dezembro' }
  ];

  const anos = Array.from({ length: 5 }, (_, i) => ano - 2 + i);

  const COLORS = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#9C27B0', '#00ACC1', '#FF7043', '#9E9E9E'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Em ambiente de produção, descomentar este código
        // const resumoData = await api.obterResumoDashboard(mes, ano);
        // const evolucaoData = await api.obterEvolucaoDashboard(6);
        // setResumo(resumoData);
        // setEvolucao(evolucaoData);
        
        // Dados simulados para desenvolvimento
        const resumoSimulado = {
          mes: mes,
          ano: ano,
          total_despesas_mes: 5200.00,
          total_despesas_pagas: 3800.00,
          total_despesas_pendentes: 1400.00,
          despesas_por_categoria: [
            { categoria: { id: 1, nome: 'Alimentação', cor: '#DB4437' }, total: 1200.00 },
            { categoria: { id: 2, nome: 'Transporte', cor: '#F4B400' }, total: 800.00 },
            { categoria: { id: 3, nome: 'Moradia', cor: '#0F9D58' }, total: 1500.00 },
            { categoria: { id: 4, nome: 'Serviços', cor: '#4285F4' }, total: 1100.00 },
            { categoria: { id: 5, nome: 'Outros', cor: '#9E9E9E' }, total: 600.00 }
          ],
          total_aportes_mes: 6000.00,
          saldos: [
            { usuario: { id: 1, nome: 'Fellype' }, saldo: 1200.00 },
            { usuario: { id: 2, nome: 'Carneiro' }, saldo: 800.00 },
            { usuario: { id: 3, nome: 'Rafael' }, saldo: -200.00 }
          ],
          proximos_vencimentos: [
            { 
              id: 1, 
              descricao: 'Aluguel', 
              valor_total: 1500.00, 
              data_vencimento: '2025-06-05',
              categoria: { nome: 'Moradia', cor: '#0F9D58' }
            },
            { 
              id: 2, 
              descricao: 'Internet', 
              valor_total: 200.00, 
              data_vencimento: '2025-06-10',
              categoria: { nome: 'Serviços', cor: '#4285F4' }
            },
            { 
              id: 3, 
              descricao: 'Energia', 
              valor_total: 350.00, 
              data_vencimento: '2025-06-15',
              categoria: { nome: 'Serviços', cor: '#4285F4' }
            }
          ]
        };
        
        const evolucaoSimulada = {
          evolucao_despesas: [
            { mes: mes - 5 > 0 ? mes - 5 : mes - 5 + 12, ano: mes - 5 > 0 ? ano : ano - 1, total: 4800.00 },
            { mes: mes - 4 > 0 ? mes - 4 : mes - 4 + 12, ano: mes - 4 > 0 ? ano : ano - 1, total: 5100.00 },
            { mes: mes - 3 > 0 ? mes - 3 : mes - 3 + 12, ano: mes - 3 > 0 ? ano : ano - 1, total: 4900.00 },
            { mes: mes - 2 > 0 ? mes - 2 : mes - 2 + 12, ano: mes - 2 > 0 ? ano : ano - 1, total: 5300.00 },
            { mes: mes - 1 > 0 ? mes - 1 : mes - 1 + 12, ano: mes - 1 > 0 ? ano : ano - 1, total: 5000.00 },
            { mes: mes, ano: ano, total: 5200.00 }
          ],
          evolucao_aportes: [
            { mes: mes - 5 > 0 ? mes - 5 : mes - 5 + 12, ano: mes - 5 > 0 ? ano : ano - 1, total: 6000.00 },
            { mes: mes - 4 > 0 ? mes - 4 : mes - 4 + 12, ano: mes - 4 > 0 ? ano : ano - 1, total: 6000.00 },
            { mes: mes - 3 > 0 ? mes - 3 : mes - 3 + 12, ano: mes - 3 > 0 ? ano : ano - 1, total: 6000.00 },
            { mes: mes - 2 > 0 ? mes - 2 : mes - 2 + 12, ano: mes - 2 > 0 ? ano : ano - 1, total: 6000.00 },
            { mes: mes - 1 > 0 ? mes - 1 : mes - 1 + 12, ano: mes - 1 > 0 ? ano : ano - 1, total: 6000.00 },
            { mes: mes, ano: ano, total: 6000.00 }
          ]
        };
        
        setResumo(resumoSimulado);
        setEvolucao(evolucaoSimulada);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        setError('Erro ao carregar dados do dashboard. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mes, ano]);

  const handleMesChange = (event) => {
    setMes(event.target.value);
  };

  const handleAnoChange = (event) => {
    setAno(event.target.value);
  };

  const formatarValor = (valor) => {
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatarData = (dataStr) => {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR');
  };

  const getNomeMes = (numeroMes) => {
    const mesAjustado = ((numeroMes - 1) % 12) + 1;
    return meses.find(m => m.valor === mesAjustado)?.nome || '';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Visão geral das finanças
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box mb={4} display="flex" gap={2}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="mes-select-label">Mês</InputLabel>
          <Select
            labelId="mes-select-label"
            id="mes-select"
            value={mes}
            onChange={handleMesChange}
            label="Mês"
          >
            {meses.map((m) => (
              <MenuItem key={m.valor} value={m.valor}>
                {m.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="outlined" size="small" sx={{ minWidth: 100 }}>
          <InputLabel id="ano-select-label">Ano</InputLabel>
          <Select
            labelId="ano-select-label"
            id="ano-select"
            value={ano}
            onChange={handleAnoChange}
            label="Ano"
          >
            {anos.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {resumo && (
        <>
          {/* Resumo financeiro */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title="Despesas do Mês" />
                <CardContent>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {formatarValor(resumo.total_despesas_mes)}
                  </Typography>
                  <Box mt={2}>
                    <Typography variant="body2" color="textSecondary">
                      Pagas: {formatarValor(resumo.total_despesas_pagas)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Pendentes: {formatarValor(resumo.total_despesas_pendentes)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title="Aportes do Mês" />
                <CardContent>
                  <Typography variant="h4" color="success.main" gutterBottom>
                    {formatarValor(resumo.total_aportes_mes)}
                  </Typography>
                  <Box mt={2}>
                    <Typography variant="body2" color="textSecondary">
                      Saldo: {formatarValor(resumo.total_aportes_mes - resumo.total_despesas_mes)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title="Saldos dos Investidores" />
                <CardContent>
                  {resumo.saldos.map((item) => (
                    <Box key={item.usuario.id} mb={1}>
                      <Typography variant="body1">
                        {item.usuario.nome}: {' '}
                        <Typography 
                          component="span" 
                          color={item.saldo >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {formatarValor(item.saldo)}
                        </Typography>
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Gráficos */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Despesas por Categoria
                </Typography>
                <Box height={300} display="flex" justifyContent="center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resumo.despesas_por_categoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="total"
                        nameKey="categoria.nome"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {resumo.despesas_por_categoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.categoria.cor || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatarValor(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Evolução de Despesas e Aportes
                </Typography>
                <Box height={300}>
                  {evolucao && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={evolucao.evolucao_despesas.map((item, index) => ({
                          mes: getNomeMes(item.mes),
                          despesas: item.total,
                          aportes: evolucao.evolucao_aportes[index].total
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatarValor(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="despesas" stroke="#DB4437" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="aportes" stroke="#0F9D58" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Próximos vencimentos */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Próximos Vencimentos
            </Typography>
            {resumo.proximos_vencimentos.length > 0 ? (
              <Box>
                {resumo.proximos_vencimentos.map((despesa) => (
                  <Box key={despesa.id} mb={2}>
                    <Grid container alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center">
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: despesa.categoria.cor || '#9E9E9E',
                              mr: 1
                            }}
                          />
                          <Typography variant="body1">
                            {despesa.descricao}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="textSecondary">
                          {formatarData(despesa.data_vencimento)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3} textAlign="right">
                        <Typography variant="body1" fontWeight="bold">
                          {formatarValor(despesa.valor_total)}
                        </Typography>
                      </Grid>
                    </Grid>
                    {resumo.proximos_vencimentos.indexOf(despesa) < resumo.proximos_vencimentos.length - 1 && (
                      <Divider sx={{ my: 1 }} />
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                Não há vencimentos próximos.
              </Typography>
            )}
          </Paper>
        </>
      )}
    </Container>
  );
};

export default Dashboard;
