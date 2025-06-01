from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.usuario import Usuario
from app import db
from werkzeug.security import generate_password_hash

usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route('/', methods=['GET'])
@jwt_required()
def listar_usuarios():
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(int(usuario_id))
    
    # Verificar se é admin
    if usuario.tipo != 'admin':
        return jsonify({'error': 'Permissão negada'}), 403
    
    # Parâmetros de filtro com validação segura
    tipo = request.args.get('tipo')
    tipo = tipo if tipo and tipo.strip() else None
    
    ativo = request.args.get('ativo')
    
    # Consulta base
    query = Usuario.query
    
    # Aplicar filtros
    if tipo:
        query = query.filter(Usuario.tipo == tipo)
    
    if ativo is not None:
        ativo_bool = ativo.lower() == 'true'
        query = query.filter(Usuario.ativo == ativo_bool)
    
    # Ordenar por nome
    usuarios = query.order_by(Usuario.nome).all()
    
    return jsonify([usuario.to_dict() for usuario in usuarios]), 200

@usuarios_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def obter_usuario(id):
    usuario_id = get_jwt_identity()
    usuario_atual = Usuario.query.get(int(usuario_id))
    
    # Verificar permissão
    if usuario_atual.tipo != 'admin' and int(usuario_id) != id:
        return jsonify({'error': 'Permissão negada'}), 403
    
    usuario = Usuario.query.get(id)
    if not usuario:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    return jsonify(usuario.to_dict()), 200

@usuarios_bp.route('/', methods=['POST'])
@jwt_required()
def criar_usuario():
    usuario_id = get_jwt_identity()
    usuario_atual = Usuario.query.get(int(usuario_id))
    
    # Verificar se é admin
    if usuario_atual.tipo != 'admin':
        return jsonify({'error': 'Permissão negada'}), 403
    
    data = request.get_json()
    
    # Validar dados obrigatórios
    campos_obrigatorios = ['nome', 'email', 'senha', 'tipo']
    
    for campo in campos_obrigatorios:
        if campo not in data:
            return jsonify({'error': f'Campo {campo} é obrigatório'}), 400
    
    # Verificar se email já existe
    if Usuario.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email já cadastrado'}), 400
    
    # Verificar tipo válido
    if data['tipo'] not in ['admin', 'investidor']:
        return jsonify({'error': 'Tipo de usuário inválido'}), 400
    
    # Criar usuário
    senha_hash = generate_password_hash(data['senha'])
    
    novo_usuario = Usuario(
        nome=data['nome'],
        email=data['email'],
        senha_hash=senha_hash,
        tipo=data['tipo'],
        ativo=data.get('ativo', True)
    )
    
    db.session.add(novo_usuario)
    db.session.commit()
    
    return jsonify(novo_usuario.to_dict()), 201

@usuarios_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def atualizar_usuario(id):
    usuario_id = get_jwt_identity()
    usuario_atual = Usuario.query.get(int(usuario_id))
    
    # Verificar permissão
    if usuario_atual.tipo != 'admin' and int(usuario_id) != id:
        return jsonify({'error': 'Permissão negada'}), 403
    
    usuario = Usuario.query.get(id)
    if not usuario:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    data = request.get_json()
    
    # Atualizar campos
    if 'nome' in data:
        usuario.nome = data['nome']
    
    if 'email' in data and data['email'] != usuario.email:
        # Verificar se email já existe
        if Usuario.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        usuario.email = data['email']
    
    if 'senha' in data:
        usuario.senha_hash = generate_password_hash(data['senha'])
    
    # Apenas admin pode alterar tipo e status ativo
    if usuario_atual.tipo == 'admin':
        if 'tipo' in data:
            if data['tipo'] not in ['admin', 'investidor']:
                return jsonify({'error': 'Tipo de usuário inválido'}), 400
            usuario.tipo = data['tipo']
        
        if 'ativo' in data:
            usuario.ativo = data['ativo']
    
    db.session.commit()
    
    return jsonify(usuario.to_dict()), 200

@usuarios_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def excluir_usuario(id):
    usuario_id = get_jwt_identity()
    usuario_atual = Usuario.query.get(int(usuario_id))
    
    # Verificar se é admin
    if usuario_atual.tipo != 'admin':
        return jsonify({'error': 'Permissão negada'}), 403
    
    # Não permitir excluir a si mesmo
    if int(usuario_id) == id:
        return jsonify({'error': 'Não é possível excluir seu próprio usuário'}), 400
    
    usuario = Usuario.query.get(id)
    if not usuario:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    # Verificar se há dependências
    if usuario.aportes or usuario.cartoes or usuario.despesas_pagas:
        # Em vez de excluir, desativar
        usuario.ativo = False
        db.session.commit()
        return jsonify({
            'message': 'Usuário desativado pois possui registros associados',
            'desativado': True
        }), 200
    
    db.session.delete(usuario)
    db.session.commit()
    
    return jsonify({'message': 'Usuário excluído com sucesso'}), 200

@usuarios_bp.route('/saldos', methods=['GET'])
@jwt_required()
def saldos_usuarios():
    # Obter todos os usuários investidores ativos
    usuarios = Usuario.query.filter_by(tipo='investidor', ativo=True).all()
    
    saldos = []
    for usuario in usuarios:
        # Total de aportes
        total_aportes = sum(aporte.valor for aporte in usuario.aportes)
        
        # Total de despesas pagas pelo usuário
        total_despesas_pagas = sum(despesa.valor_total for despesa in usuario.despesas_pagas)
        
        # Total de despesas divididas (valor dividido por investidor)
        total_despesas_divididas = db.session.query(
            db.func.sum(Despesa.valor_dividido)
        ).filter(Despesa.status == 'pago').scalar() or 0
        
        # Calcular saldo
        saldo = total_aportes - total_despesas_divididas
        
        # Adicionar à lista
        saldos.append({
            'usuario': usuario.to_dict(),
            'total_aportes': total_aportes,
            'total_despesas_pagas': total_despesas_pagas,
            'total_despesas_divididas': total_despesas_divididas,
            'saldo': saldo
        })
    
    return jsonify(saldos), 200
