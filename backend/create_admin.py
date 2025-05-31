from main import app  # importa o app já configurado
from app import db
from app.models.usuario import Usuario
from werkzeug.security import generate_password_hash

def criar_admin():
    with app.app_context():
        email = 'fellype@controle-financeiro.com'
        senha = 'Admin@2025'

        if Usuario.query.filter_by(email=email).first():
            print("Usuário admin já existe.")
            return

        novo = Usuario(
            nome='Admin',
            email=email,
            senha_hash=generate_password_hash(senha),
            tipo='admin',
            ativo=True
        )

        db.session.add(novo)
        db.session.commit()
        print("Usuário admin criado com sucesso!")

if __name__ == '__main__':
    criar_admin()
