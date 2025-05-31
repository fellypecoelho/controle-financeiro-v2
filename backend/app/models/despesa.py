from app import db
from datetime import datetime

class Despesa(db.Model):
    __tablename__ = 'despesas'
    
    id = db.Column(db.Integer, primary_key=True)
    origem = db.Column(db.String(100))
    descricao = db.Column(db.String(255), nullable=False)
    categoria_id = db.Column(db.Integer, db.ForeignKey('categorias.id'), nullable=False)
    valor_total = db.Column(db.Float, nullable=False)
    valor_dividido = db.Column(db.Float)  # Valor dividido entre investidores
    data_compra = db.Column(db.Date, nullable=False)
    data_vencimento = db.Column(db.Date, nullable=False)
    forma_pagamento = db.Column(db.String(50))  # Cartão, Transferência, etc.
    cartao_id = db.Column(db.Integer, db.ForeignKey('cartoes.id'))
    pago_por_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    status = db.Column(db.String(20), default='pendente')  # pendente, pago
    tipo_despesa = db.Column(db.String(20), nullable=False)  # única, recorrente, parcelada
    frequencia = db.Column(db.String(20))  # mensal, trimestral, anual (para recorrentes)
    total_parcelas = db.Column(db.Integer)  # Para despesas parceladas
    parcela_atual = db.Column(db.Integer)  # Para despesas parceladas
    despesa_pai_id = db.Column(db.Integer, db.ForeignKey('despesas.id'))  # Para recorrências/parcelas
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    despesas_filhas = db.relationship('Despesa', backref=db.backref('despesa_pai', remote_side=[id]), lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'origem': self.origem,
            'descricao': self.descricao,
            'categoria_id': self.categoria_id,
            'categoria': self.categoria.to_dict() if self.categoria else None,
            'valor_total': self.valor_total,
            'valor_dividido': self.valor_dividido,
            'data_compra': self.data_compra.isoformat() if self.data_compra else None,
            'data_vencimento': self.data_vencimento.isoformat() if self.data_vencimento else None,
            'forma_pagamento': self.forma_pagamento,
            'cartao_id': self.cartao_id,
            'cartao': self.cartao.to_dict() if self.cartao else None,
            'pago_por_id': self.pago_por_id,
            'pago_por': self.pago_por.to_dict() if self.pago_por else None,
            'status': self.status,
            'tipo_despesa': self.tipo_despesa,
            'frequencia': self.frequencia,
            'total_parcelas': self.total_parcelas,
            'parcela_atual': self.parcela_atual,
            'despesa_pai_id': self.despesa_pai_id,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None
        }
