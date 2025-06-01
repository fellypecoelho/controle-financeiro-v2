from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from app import db, jwt
from app.models import *
from app.routes import *

# Carrega variáveis do .env
load_dotenv()

app = Flask(__name__)
app.url_map.strict_slashes = False

# Configurações do app
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configuração de segurança melhorada para JWT
jwt_key = os.environ.get('JWT_SECRET_KEY')
if not jwt_key:
    # Em produção, isso deve gerar um erro, mas para desenvolvimento mantemos o fallback
    jwt_key = 'chave-secreta-temporaria'
    print("AVISO: JWT_SECRET_KEY não definida. Usando chave temporária. Isso não é seguro para produção!")
app.config['JWT_SECRET_KEY'] = jwt_key
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Inicializar extensões
db.init_app(app)
jwt.init_app(app)

# CORS: permite acesso do frontend local e do domínio da Vercel
# Corrigido para permitir acesso a todas as rotas, não apenas /api/*
CORS(app, resources={r"/*": {
    "origins": [
        "http://localhost:3000",
        "https://controle-financeiro-efvi.vercel.app"
    ]
}}, supports_credentials=True)

# Registrar rotas com prefixo /api
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(usuarios_bp, url_prefix='/api/usuarios')
app.register_blueprint(despesas_bp, url_prefix='/api/despesas')
app.register_blueprint(aportes_bp, url_prefix='/api/aportes')
app.register_blueprint(cartoes_bp, url_prefix='/api/cartoes')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

@app.route('/api/status')
def status():
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
