from app import db
from datetime import datetime

class Aporte(db.Model):
    __tablename__ = 'aportes'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    valor = db.Column(db.Float, nullable=False)
    data = db.Column(db.Date, nullable=False)
    observacao = db.Column(db.String(255))
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'usuario': self.usuario.to_dict() if self.usuario else None,
            'valor': self.valor,
            'data': self.data.isoformat() if self.data else None,
            'observacao': self.observacao,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None
        }
