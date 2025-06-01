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
import api from '../services/api'; // Certifique-se que api.js está configurado corretamente

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

  // Gera os últimos 5 anos incluindo o atual
  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).sort(); 

  const COLORS = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#9C27B0', '#00ACC1', '#FF7043', '#9E9E9E'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      setResumo(null); // Limpa dados antigos ao recarregar
      setEvolucao(null);
      try {
        // --- CORREÇÃO: Usando as funções específicas do api.js --- 
        // Busca o resumo do mês/ano selecionado
        const resumoData = await api.obterResumoDashboard(mes, ano); 
        // Busca a evolução dos últimos 6 meses (ajuste o número de meses se necessário)
        const evolucaoData = await api.obterEvolucaoDashboard(6); 
        
        // Como o interceptor do api.js já retorna response.data, usamos diretamente
        setResumo(resumoData); 
        setEvolucao(evolucaoData);
        
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        // Tenta extrair mensagem de erro da resposta da API, se disponível
        const errorMessage = error.response?.data?.error || 'Erro ao carregar dados do dashboard. Verifique a conexão com o backend e tente novamente.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mes, ano]); // Dependências: recarrega quando mês ou ano mudam

  const handleMesChange = (event) => {
    setMes(event.target.value);
  };

  const handleAnoChange = (event) => {
    setAno(event.target.value);
  };

  // Função segura para formatar valor, tratando null/undefined
  const formatarValor = (valor) => {
    if (valor === null || valor === undefined) return 'R$ 0,00';
    return `R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Função segura para formatar data, tratando null/undefined
  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    try {
      // Tenta criar data a partir de ISO string (YYYY-MM-DD)
      const data = new Date(dataStr + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso horário
      if (isNaN(data.getTime())) return '-'; // Data inválida
      return data.toLocaleDateString('pt-BR');
    } catch (e) {
      return '-'; // Retorna '-' em caso de erro
    }
  };

  const getNomeMes = (numeroMes) => {
    const mesObj = meses.find(m => m.valor === numeroMes);
    return mesObj ? mesObj.nome : '';
  };

  // Prepara dados para o gráfico de evolução, garantindo que ambos os arrays tenham o mesmo tamanho
  const prepararDadosEvolucao = () => {
    if (!evolucao || !evolucao.evolucao_despesas || !evolucao.evolucao_aportes) return [];
    
    const despesasMap = new Map(evolucao.evolucao_despesas.map(item => [`${item.ano}-${item.mes}`, item.total]));
    const aportesMap = new Map(evolucao.evolucao_aportes.map(item => [`${item.ano}-${item.mes}`, item.total]));
    
    // Cria um conjunto de todas as chaves (ano-mes) presentes em ambos os arrays
    const chaves = new Set([
      ...evolucao.evolucao_despesas.map(item => `${item.ano}-${item.mes}`),
      ...evolucao.evolucao_aportes.map(item => `${item.ano}-${item.mes}`)
    ]);

    // Ordena as chaves cronologicamente (pode precisar de ajuste se os meses/anos não forem sequenciais)
    const chavesOrdenadas = Array.from(chaves).sort((a, b) => {
        const [anoA, mesA] = a.split('-').map(Number);
        const [anoB, mesB] = b.split('-').map(Number);
        if (anoA !== anoB) return anoA - anoB;
        return mesA - mesB;
    });

    return chavesOrdenadas.map(chave => {
      const [ano, mes] = chave.split('-').map(Number);
      return {
        mes: getNomeMes(mes),
        despesas: despesasMap.get(chave) || 0,
        aportes: aportesMap.get(chave) || 0
      };
    });
  };

  const dadosEvolucao = prepararDadosEvolucao();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Visão geral das finanças
          </Typography>
        </div>
        <Box display="flex" gap={2}>
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
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Renderiza apenas se não houver erro e tiver dados */} 
      {!error && resumo && (
        <>
          {/* Resumo financeiro */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title="Despesas do Mês" />
                <CardContent>
                  <Typography variant="h4" color="error.main" gutterBottom>
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
                      Saldo Mês: {formatarValor(resumo.total_aportes_mes - resumo.total_despesas_mes)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title="Saldos dos Investidores" />
                <CardContent>
                  {resumo.saldos && resumo.saldos.length > 0 ? (
                    resumo.saldos.map((item) => (
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
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">Sem dados de saldo.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Gráficos */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: 400 }}> {/* Aumentei a altura */} 
                <Typography variant="h6" gutterBottom>
                  Despesas por Categoria
                </Typography>
                {resumo.despesas_por_categoria && resumo.despesas_por_categoria.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resumo.despesas_por_categoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120} // Aumentei o raio
                        fill="#8884d8"
                        dataKey="total"
                        nameKey="categoria.nome"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {resumo.despesas_por_categoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.categoria?.cor || COLORS[index % COLORS.length]} /> // Acesso seguro à cor
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [formatarValor(value), name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography variant="body2" color="textSecondary">Sem dados de despesas para este mês.</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: 400 }}> {/* Aumentei a altura */} 
                <Typography variant="h6" gutterBottom>
                  Evolução Mensal (Últimos 6 Meses)
                </Typography>
                {evolucao && dadosEvolucao.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dadosEvolucao}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis tickFormatter={formatarValor} width={100} /> {/* Adicionei formatação e largura */} 
                      <Tooltip formatter={(value) => formatarValor(value)} />
                      <Legend />
                      <Line name="Despesas" type="monotone" dataKey="despesas" stroke="#DB4437" activeDot={{ r: 8 }} strokeWidth={2} />
                      <Line name="Aportes" type="monotone" dataKey="aportes" stroke="#0F9D58" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                   <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography variant="body2" color="textSecondary">Sem dados de evolução disponíveis.</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Próximos vencimentos */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Próximos Vencimentos (Despesas Pendentes)
            </Typography>
            {resumo.proximos_vencimentos && resumo.proximos_vencimentos.length > 0 ? (
              <Box>
                {resumo.proximos_vencimentos.map((despesa) => (
                  <React.Fragment key={despesa.id}>
                    <Grid container alignItems="center" spacing={1}>
                      <Grid item xs={12} sm={5}>
                        <Box display="flex" alignItems="center">
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: despesa.categoria?.cor || '#9E9E9E', // Acesso seguro à cor
                              mr: 1,
                              flexShrink: 0
                            }}
                          />
                          <Typography variant="body1" noWrap title={despesa.descricao}>
                            {despesa.descricao}
                          </Typography>
                        </Box>
                      </Grid>
                       <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="textSecondary">
                          {despesa.categoria?.nome || 'Sem Categoria'} {/* Acesso seguro */} 
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Typography variant="body2" color="textSecondary">
                          {formatarData(despesa.data_vencimento)} {/* Usa data_vencimento */} 
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2} textAlign={{ xs: 'left', sm: 'right' }}>
                        <Typography variant="body1" fontWeight="bold">
                          {formatarValor(despesa.valor_total)}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Divider sx={{ my: 1.5 }} />
                  </React.Fragment>
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

