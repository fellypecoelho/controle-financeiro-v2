from flask import Blueprint
from app.routes.auth import auth_bp
from app.routes.usuarios import usuarios_bp
from app.routes.despesas import despesas_bp
from app.routes.aportes import aportes_bp
from app.routes.cartoes import cartoes_bp
from app.routes.dashboard import dashboard_bp

# Importar todos os blueprints para que sejam registrados no app
__all__ = ['auth_bp', 'usuarios_bp', 'despesas_bp', 'aportes_bp', 'cartoes_bp', 'dashboard_bp']
