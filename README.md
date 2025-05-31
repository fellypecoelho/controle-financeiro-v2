# Sistema de Controle Financeiro

Este pacote contém o código-fonte completo do Sistema de Controle Financeiro desenvolvido para substituir a planilha de controle de gastos da empresa.

## Estrutura do Projeto

O sistema está dividido em duas partes principais:

- **Backend**: API RESTful desenvolvida com Flask (Python)
- **Frontend**: Interface de usuário desenvolvida com React e Material UI

## Requisitos do Sistema

### Backend
- Python 3.8+
- Flask e dependências (listadas em `backend/requirements.txt`)
- SQLite (para desenvolvimento) ou PostgreSQL (para produção)

### Frontend
- Node.js 14+
- npm ou yarn
- React 18+

## Instruções de Instalação

### Backend

1. Navegue até a pasta do backend:
```
cd backend
```

2. Crie um ambiente virtual Python:
```
python -m venv venv
```

3. Ative o ambiente virtual:
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

4. Instale as dependências:
```
pip install -r requirements.txt
```

5. Configure as variáveis de ambiente:
- Crie um arquivo `.env` baseado no `.env.example`
- Defina as variáveis necessárias (banco de dados, chave secreta, etc.)

6. Inicialize o banco de dados:
```
python -c "from app import app; from app.utils.db_init import inicializar_banco; app.app_context().push(); inicializar_banco()"
```

7. Inicie o servidor:
```
flask run
```

O backend estará disponível em `http://localhost:5000`.

### Frontend

1. Navegue até a pasta do frontend:
```
cd frontend
```

2. Instale as dependências:
```
npm install
```

3. Configure a URL da API:
- Edite o arquivo `src/services/api.js` e atualize a variável `baseURL` para apontar para o seu backend

4. Inicie o servidor de desenvolvimento:
```
npm start
```

O frontend estará disponível em `http://localhost:3000`.

## Implantação em Produção

### Backend

Para implantar o backend em produção, recomendamos:

1. Configurar um servidor com Python e WSGI (Gunicorn, uWSGI)
2. Configurar um banco de dados PostgreSQL
3. Usar um servidor web como Nginx ou Apache como proxy reverso
4. Configurar variáveis de ambiente para produção

Exemplo de comando para iniciar com Gunicorn:
```
gunicorn app:app -w 4 -b 0.0.0.0:5000
```

### Frontend

Para implantar o frontend em produção:

1. Gere a build de produção:
```
npm run build
```

2. Hospede os arquivos estáticos gerados na pasta `build` em qualquer servidor web (Nginx, Apache, Netlify, Vercel, etc.)

## Credenciais de Acesso

O sistema vem pré-configurado com os seguintes usuários:

**Administrador**:
- Email: fellype@controle-financeiro.com
- Senha: Admin@2025

**Investidores**:
- Carneiro: carneiro@controle-financeiro.com (Senha: Invest1@2025)
- Rafael: rafael@controle-financeiro.com (Senha: Invest2@2025)
- Ruan: ruan@controle-financeiro.com (Senha: Invest3@2025)

## Funcionalidades Principais

- Gestão completa de despesas (únicas, recorrentes e parceladas)
- Divisão automática de despesas entre investidores
- Controle de aportes e saldos
- Gerenciamento de cartões de crédito com ciclos de fechamento/vencimento
- Dashboard com gráficos e resumos financeiros
- Calendário de vencimentos
- Relatórios detalhados

## Suporte

Para qualquer dúvida ou suporte adicional, entre em contato com a equipe de desenvolvimento.
