from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.aporte import Aporte
from app.models.usuario import Usuario
from app import db
from datetime import datetime

aportes_bp = Blueprint('aportes', __name__)

@aportes_bp.route('/', methods=['GET'])
@jwt_required()
def listar_aportes():
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(usuario_id)
    
    # Parâmetros de filtro
    try:
        usuario_id_filtro = int(request.args.get('usuario_id') or '')
    except ValueError:
        usuario_id_filtro = None

    data_inicio = request.args.get('data_inicio')
    data_fim = request.args.get('data_fim')
    busca = request.args.get('busca')
    
    # Consulta base
    query = Aporte.query
    
    # Aplicar filtros
    if usuario_id_filtro:
        query = query.filter(Aporte.usuario_id == usuario_id_filtro)
    
    if data_inicio:
        try:
            data_inicio_obj = datetime.fromisoformat(data_inicio).date()
            query = query.filter(Aporte.data >= data_inicio_obj)
        except ValueError:
            return jsonify({'error': 'Formato de data inicial inválido'}), 400
    
    if data_fim:
        try:
            data_fim_obj = datetime.fromisoformat(data_fim).date()
            query = query.filter(Aporte.data <= data_fim_obj)
        except ValueError:
            return jsonify({'error': 'Formato de data final inválido'}), 400
    
    if busca:
        query = query.filter(Aporte.observacao.ilike(f'%{busca}%'))
    
    # Ordenar por data
    aportes = query.order_by(Aporte.data.desc()).all()
    
    return jsonify([aporte.to_dict() for aporte in aportes]), 200

@aportes_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def obter_aporte(id):
    aporte = Aporte.query.get(id)
    
    if not aporte:
        return jsonify({'error': 'Aporte não encontrado'}), 404
    
    return jsonify(aporte.to_dict()), 200

@aportes_bp.route('/', methods=['POST'])
@jwt_required()
def criar_aporte():
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(usuario_id)
    
    # Verificar se é admin
    if usuario.tipo != 'admin':
        return jsonify({'error': 'Permissão negada'}), 403
    
    data = request.get_json()
    
    # Validar dados obrigatórios
    campos_obrigatorios = ['usuario_id', 'valor', 'data']
    
    for campo in campos_obrigatorios:
        if campo not in data:
            return jsonify({'error': f'Campo {campo} é obrigatório'}), 400
    
    # Converter data de string para objeto date
    try:
        data_aporte = datetime.fromisoformat(data['data']).date()
    except ValueError:
        return jsonify({'error': 'Formato de data inválido'}), 400
    
    # Verificar se usuário existe
    usuario_aporte = Usuario.query.get(data['usuario_id'])
    if not usuario_aporte:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    # Criar aporte
    novo_aporte = Aporte(
        usuario_id=data['usuario_id'],
        valor=data['valor'],
        data=data_aporte,
        observacao=data.get('observacao', '')
    )
    
    db.session.add(novo_aporte)
    db.session.commit()
    
    return jsonify(novo_aporte.to_dict()), 201

@aportes_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def atualizar_aporte(id):
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(usuario_id)
    
    # Verificar se é admin
    if usuario.tipo != 'admin':
        return jsonify({'error': 'Permissão negada'}), 403
    
    aporte = Aporte.query.get(id)
    if not aporte:
        return jsonify({'error': 'Aporte não encontrado'}), 404
    
    data = request.get_json()
    
    # Atualizar campos
    if 'usuario_id' in data:
        usuario_aporte = Usuario.query.get(data['usuario_id'])
        if not usuario_aporte:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        aporte.usuario_id = data['usuario_id']
    
    if 'valor' in data:
        aporte.valor = data['valor']
    
    if 'data' in data:
        try:
            aporte.data = datetime.fromisoformat(data['data']).date()
        except ValueError:
            return jsonify({'error': 'Formato de data inválido'}), 400
    
    if 'observacao' in data:
        aporte.observacao = data['observacao']
    
    db.session.commit()
    
    return jsonify(aporte.to_dict()), 200

@aportes_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def excluir_aporte(id):
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(usuario_id)
    
    # Verificar se é admin
    if usuario.tipo != 'admin':
        return jsonify({'error': 'Permissão negada'}), 403
    
    aporte = Aporte.query.get(id)
    if not aporte:
        return jsonify({'error': 'Aporte não encontrado'}), 404
    
    db.session.delete(aporte)
    db.session.commit()
    
    return jsonify({'message': 'Aporte excluído com sucesso'}), 200

@aportes_bp.route('/totais', methods=['GET'])
@jwt_required()
def totais_aportes():
    # Parâmetros de filtro
    usuario_id = request.args.get('usuario_id', type=int)
    ano = request.args.get('ano', type=int, default=datetime.now().year)
    
    # Consulta base
    query = Aporte.query.filter(
        db.extract('year', Aporte.data) == ano
    )
    
    if usuario_id:
        query = query.filter(Aporte.usuario_id == usuario_id)
    
    # Calcular totais
    aportes = query.all()
    
    total_geral = sum(aporte.valor for aporte in aportes)
    
    # Agrupar por usuário
    totais_por_usuario = {}
    for aporte in aportes:
        if aporte.usuario_id not in totais_por_usuario:
            totais_por_usuario[aporte.usuario_id] = {
                'usuario': aporte.usuario.to_dict(),
                'total': 0
            }
        totais_por_usuario[aporte.usuario_id]['total'] += aporte.valor
    
    # Agrupar por mês
    totais_por_mes = {}
    for aporte in aportes:
        mes = aporte.data.month
        if mes not in totais_por_mes:
            totais_por_mes[mes] = 0
        totais_por_mes[mes] += aporte.valor
    
    return jsonify({
        'total_geral': total_geral,
        'totais_por_usuario': list(totais_por_usuario.values()),
        'totais_por_mes': [{'mes': mes, 'total': total} for mes, total in totais_por_mes.items()]
    }), 200
