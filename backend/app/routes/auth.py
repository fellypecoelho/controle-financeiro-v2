from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.usuario import Usuario
from app import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('senha'):
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400
    
    usuario = Usuario.query.filter_by(email=data['email']).first()
    
    if not usuario or not check_password_hash(usuario.senha_hash, data['senha']):
        return jsonify({'error': 'Email ou senha inválidos'}), 401
    
    if not usuario.ativo:
        return jsonify({'error': 'Usuário desativado'}), 401
    
    access_token = create_access_token(identity=usuario.id)
    
    return jsonify({
        'token': access_token,
        'user': usuario.to_dict()
    }), 200

@auth_bp.route('/registro', methods=['POST'])
def registro():
    data = request.get_json()
    
    if not data or not data.get('nome') or not data.get('email') or not data.get('senha'):
        return jsonify({'error': 'Nome, email e senha são obrigatórios'}), 400
    
    if Usuario.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email já cadastrado'}), 400
    
    senha_hash = generate_password_hash(data['senha'])
    
    tipo = data.get('tipo', 'investidor')
    if tipo not in ['admin', 'investidor']:
        tipo = 'investidor'
    
    novo_usuario = Usuario(
        nome=data['nome'],
        email=data['email'],
        senha_hash=senha_hash,
        tipo=tipo
    )
    
    db.session.add(novo_usuario)
    db.session.commit()
    
    access_token = create_access_token(identity=novo_usuario.id)
    
    return jsonify({
        'token': access_token,
        'user': novo_usuario.to_dict()
    }), 201

@auth_bp.route('/verificar', methods=['GET'])
@jwt_required()
def verificar():
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(usuario_id)
    
    if not usuario:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    if not usuario.ativo:
        return jsonify({'error': 'Usuário desativado'}), 401
    
    return jsonify({'user': usuario.to_dict()}), 200
