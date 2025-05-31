from app import db
from datetime import datetime

class Categoria(db.Model):
    __tablename__ = 'categorias'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.String(255))
    cor = db.Column(db.String(20), default='#4285F4')  # Cor padrão azul Google
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    despesas = db.relationship('Despesa', backref='categoria', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'descricao': self.descricao,
            'cor': self.cor,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None
        }
