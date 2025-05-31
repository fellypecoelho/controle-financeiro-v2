from app import db
from datetime import datetime

class Cartao(db.Model):
    __tablename__ = 'cartoes'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    bandeira = db.Column(db.String(50))
    dia_fechamento = db.Column(db.Integer, nullable=False)  # Dia do mês em que fecha a fatura
    dia_vencimento = db.Column(db.Integer, nullable=False)  # Dia do mês em que vence a fatura
    limite = db.Column(db.Float, default=0.0)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    despesas = db.relationship('Despesa', backref='cartao', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'bandeira': self.bandeira,
            'dia_fechamento': self.dia_fechamento,
            'dia_vencimento': self.dia_vencimento,
            'limite': self.limite,
            'usuario_id': self.usuario_id,
            'usuario': self.usuario.to_dict() if self.usuario else None,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None
        }
    
    def proxima_fatura(self):
        hoje = datetime.now()
        ano = hoje.year
        mes = hoje.month
        
        # Determinar data de fechamento
        if hoje.day > self.dia_fechamento:
            # Se já passou do dia de fechamento, a próxima fatura fecha no próximo mês
            mes += 1
            if mes > 12:
                mes = 1
                ano += 1
        
        data_fechamento = datetime(ano, mes, self.dia_fechamento)
        
        # Determinar data de vencimento
        mes_vencimento = mes
        ano_vencimento = ano
        if self.dia_vencimento < self.dia_fechamento:
            # Se o vencimento é antes do fechamento, o vencimento é no mês seguinte
            mes_vencimento += 1
            if mes_vencimento > 12:
                mes_vencimento = 1
                ano_vencimento += 1
        
        data_vencimento = datetime(ano_vencimento, mes_vencimento, self.dia_vencimento)
        
        return {
            'fechamento': data_fechamento.isoformat(),
            'vencimento': data_vencimento.isoformat(),
            'valor_previsto': 0.0  # Será calculado com base nas despesas
        }
