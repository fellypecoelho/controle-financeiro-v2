from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_pyfile('../config.py')  # Você pode trocar isso por configurações diretas

    db.init_app(app)
    jwt.init_app(app)
    CORS(app)

    # Importar e registrar rotas
    from app.routes.usuarios import usuarios_bp
    from app.routes.aportes import aportes_bp
    from app.routes.cartoes import cartoes_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.despesas import despesas_bp
    from app.routes.auth import auth_bp

    app.register_blueprint(usuarios_bp, url_prefix='/usuarios')
    app.register_blueprint(aportes_bp, url_prefix='/aportes')
    app.register_blueprint(cartoes_bp, url_prefix='/cartoes')
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
    app.register_blueprint(despesas_bp, url_prefix='/despesas')
    app.register_blueprint(auth_bp, url_prefix='/auth')

    return app
