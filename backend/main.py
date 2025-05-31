from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

from app import db, jwt
from app.models import *
from app.routes import *

load_dotenv()

app = Flask(__name__)

# Correção de CORS para permitir chamadas do frontend (localhost e produção)
CORS(app, origins=[
    "http://localhost:3000",
    "https://controle-financeiro-efvi.vercel.app"
])

# Configurações do app
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'chave-secreta-temporaria')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Inicializar extensões
db.init_app(app)
jwt.init_app(app)

# Registrar blueprints com prefixo /api
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
