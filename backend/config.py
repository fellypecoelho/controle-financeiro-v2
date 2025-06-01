# Conteúdo para backend/config.py

import os
from dotenv import load_dotenv

# Carrega variáveis do .env para o ambiente (redundante se já feito em main.py, mas seguro)
load_dotenv()

# Configurações básicas (pode adicionar mais)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "uma-chave-secreta-padrao-muito-forte") # Usa a chave do .env ou uma padrão
SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")
SQLALCHEMY_TRACK_MODIFICATIONS = False
JWT_SECRET_KEY = SECRET_KEY # Garante que JWT use a mesma chave

# Outras configurações que possa precisar...
# DEBUG = os.getenv("FLASK_ENV") == "development"

