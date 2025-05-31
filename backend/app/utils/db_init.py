from app import db
from app.models.usuario import Usuario
from app.models.categoria import Categoria
from app.models.cartao import Cartao
from werkzeug.security import generate_password_hash
from datetime import datetime

def inicializar_banco():
    """Inicializa o banco de dados com dados iniciais"""
    
    # Criar categorias padrão
    categorias = [
        {'nome': 'Alimentação', 'descricao': 'Gastos com alimentação', 'cor': '#DB4437'},
        {'nome': 'Transporte', 'descricao': 'Gastos com transporte', 'cor': '#F4B400'},
        {'nome': 'Moradia', 'descricao': 'Gastos com moradia', 'cor': '#0F9D58'},
        {'nome': 'Saúde', 'descricao': 'Gastos com saúde', 'cor': '#4285F4'},
        {'nome': 'Educação', 'descricao': 'Gastos com educação', 'cor': '#AB47BC'},
        {'nome': 'Lazer', 'descricao': 'Gastos com lazer', 'cor': '#00ACC1'},
        {'nome': 'Serviços', 'descricao': 'Gastos com serviços', 'cor': '#FF7043'},
        {'nome': 'Outros', 'descricao': 'Outros gastos', 'cor': '#9E9E9E'}
    ]
    
    for cat in categorias:
        categoria = Categoria.query.filter_by(nome=cat['nome']).first()
        if not categoria:
            nova_categoria = Categoria(
                nome=cat['nome'],
                descricao=cat['descricao'],
                cor=cat['cor']
            )
            db.session.add(nova_categoria)
    
    # Criar usuário administrador (Fellype)
    admin = Usuario.query.filter_by(email='fellype@controle-financeiro.com').first()
    if not admin:
        novo_admin = Usuario(
            nome='Fellype',
            email='fellype@controle-financeiro.com',
            senha_hash=generate_password_hash('Admin@2025'),
            tipo='admin'
        )
        db.session.add(novo_admin)
    
    # Criar usuários investidores
    investidores = [
        {'nome': 'Carneiro', 'email': 'carneiro@controle-financeiro.com', 'senha': 'Invest1@2025'},
        {'nome': 'Rafael', 'email': 'rafael@controle-financeiro.com', 'senha': 'Invest2@2025'},
        {'nome': 'Ruan', 'email': 'ruan@controle-financeiro.com', 'senha': 'Invest3@2025'}
    ]
    
    for inv in investidores:
        investidor = Usuario.query.filter_by(email=inv['email']).first()
        if not investidor:
            novo_investidor = Usuario(
                nome=inv['nome'],
                email=inv['email'],
                senha_hash=generate_password_hash(inv['senha']),
                tipo='investidor'
            )
            db.session.add(novo_investidor)
    
    # Commit das alterações
    db.session.commit()
    
    print("Banco de dados inicializado com sucesso!")

def limpar_banco():
    """Limpa todos os dados do banco de dados"""
    meta = db.metadata
    for table in reversed(meta.sorted_tables):
        db.session.execute(table.delete())
    db.session.commit()
    print("Banco de dados limpo com sucesso!")

if __name__ == '__main__':
    from app import app
    with app.app_context():
        db.create_all()
        inicializar_banco()
