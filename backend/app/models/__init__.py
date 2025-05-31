from app import db
from app.models.usuario import Usuario
from app.models.categoria import Categoria
from app.models.cartao import Cartao
from app.models.despesa import Despesa
from app.models.aporte import Aporte

# Importar todos os modelos para que sejam reconhecidos pelo SQLAlchemy
__all__ = ['Usuario', 'Categoria', 'Cartao', 'Despesa', 'Aporte']
