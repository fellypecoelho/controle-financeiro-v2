from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import extract
from app.models.despesa import Despesa
from app.models.usuario import Usuario
from app.models.categoria import Categoria
from app.models.cartao import Cartao
from app import db

despesas_bp = Blueprint("despesas", __name__)

@despesas_bp.route("/", methods=["GET"])
@jwt_required()
def listar_despesas():
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(int(usuario_id))
    
    query = Despesa.query

    if usuario.tipo != 'admin':
        query = query.filter(Despesa.usuario_id == int(usuario_id))

    categoria_id = request.args.get('categoria_id')
    if categoria_id:
        try:
            query = query.filter(Despesa.categoria_id == int(categoria_id))
        except ValueError:
            return jsonify({"error": "categoria_id inválido"}), 400

    status = request.args.get('status')
    if status:
        query = query.filter(Despesa.status == status)

    tipo = request.args.get('tipo')
    if tipo:
        query = query.filter(Despesa.tipo == tipo)

    mes = request.args.get('mes')
    ano = request.args.get('ano')
    if mes and ano:
        try:
            query = query.filter(
                extract('month', Despesa.data_compra) == int(mes),
                extract('year', Despesa.data_compra) == int(ano)
            )
        except ValueError:
            return jsonify({"error": "Mês ou ano inválido"}), 400
    elif ano:
        try:
            query = query.filter(extract('year', Despesa.data_compra) == int(ano))
        except ValueError:
            return jsonify({"error": "Ano inválido"}), 400

    cartao_id = request.args.get('cartao_id')
    if cartao_id:
        try:
            query = query.filter(Despesa.cartao_id == int(cartao_id))
        except ValueError:
            return jsonify({"error": "cartao_id inválido"}), 400

    despesas = query.order_by(Despesa.data_compra.desc()).all()
    return jsonify([d.to_dict() for d in despesas]), 200

@despesas_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def obter_despesa(id):
    usuario_id = get_jwt_identity()
    despesa = Despesa.query.get(id)

    if not despesa:
        return jsonify({"error": "Despesa não encontrada"}), 404

    usuario = Usuario.query.get(int(usuario_id))
    if usuario.tipo != 'admin' and despesa.usuario_id != int(usuario_id):
        return jsonify({"error": "Permissão negada"}), 403

    return jsonify(despesa.to_dict()), 200

@despesas_bp.route("/", methods=["POST"])
@jwt_required()
def criar_despesa():
    usuario_id = get_jwt_identity()
    data = request.get_json()

    campos_obrigatorios = ['descricao', 'valor_total', 'data_compra', 'categoria_id', 'tipo']
    for campo in campos_obrigatorios:
        if campo not in data or not data[campo]:
            return jsonify({"error": f"Campo '{campo}' é obrigatório"}), 400

    try:
        valor_total = float(data['valor_total'])
        if valor_total <= 0:
            return jsonify({"error": "Valor total deve ser positivo"}), 400
        data_compra = datetime.fromisoformat(data['data_compra'].split('T')[0])
        categoria_id = int(data['categoria_id'])
        tipo = data['tipo']
        if tipo not in ['receita', 'despesa']:
            return jsonify({"error": "Tipo inválido"}), 400
        if not Categoria.query.get(categoria_id):
            return jsonify({"error": "Categoria não encontrada"}), 404
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Erro nos dados: {e}"}), 400

    cartao_id = data.get('cartao_id')
    num_parcelas = data.get('num_parcelas', 1)

    if cartao_id:
        try:
            cartao_id = int(cartao_id)
            if not Cartao.query.get(cartao_id):
                return jsonify({"error": "Cartão não encontrado"}), 404
        except (ValueError, TypeError):
            return jsonify({"error": "cartao_id inválido"}), 400
    else:
        cartao_id = None

    try:
        num_parcelas = int(num_parcelas)
        if num_parcelas < 1:
            return jsonify({"error": "Número de parcelas inválido"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Número de parcelas inválido"}), 400

    nova_despesa = Despesa(
        descricao=data['descricao'],
        valor_total=valor_total,
        data_compra=data_compra,
        categoria_id=categoria_id,
        usuario_id=int(usuario_id),
        tipo=tipo,
        status=data.get('status', 'pendente'),
        cartao_id=cartao_id,
        num_parcelas=num_parcelas,
        parcela_atual=1,
        observacao=data.get('observacao')
    )

    db.session.add(nova_despesa)
    db.session.commit()

    return jsonify(nova_despesa.to_dict()), 201

@despesas_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def atualizar_despesa(id):
    usuario_id = get_jwt_identity()
    despesa = Despesa.query.get(id)

    if not despesa:
        return jsonify({"error": "Despesa não encontrada"}), 404

    usuario = Usuario.query.get(int(usuario_id))
    if usuario.tipo != 'admin' and despesa.usuario_id != int(usuario_id):
        return jsonify({"error": "Permissão negada"}), 403

    data = request.get_json()

    if 'descricao' in data:
        despesa.descricao = data['descricao']
    if 'valor_total' in data:
        try:
            despesa.valor_total = float(data['valor_total'])
        except ValueError:
            return jsonify({"error": "Valor inválido"}), 400
    if 'data_compra' in data:
        try:
            despesa.data_compra = datetime.fromisoformat(data['data_compra'].split('T')[0])
        except ValueError:
            return jsonify({"error": "Data inválida"}), 400
    if 'categoria_id' in data:
        despesa.categoria_id = data['categoria_id']
    if 'status' in data:
        despesa.status = data['status']
    if 'observacao' in data:
        despesa.observacao = data['observacao']

    db.session.commit()
    return jsonify(despesa.to_dict()), 200

@despesas_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def excluir_despesa(id):
    usuario_id = get_jwt_identity()
    despesa = Despesa.query.get(id)

    if not despesa:
        return jsonify({"error": "Despesa não encontrada"}), 404

    usuario = Usuario.query.get(int(usuario_id))
    if usuario.tipo != 'admin' and despesa.usuario_id != int(usuario_id):
        return jsonify({"error": "Permissão negada"}), 403

    db.session.delete(despesa)
    db.session.commit()

    return jsonify({"message": "Despesa excluída com sucesso"}), 200
