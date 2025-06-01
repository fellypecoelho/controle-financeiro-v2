from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models.cartao import Cartao
from app.models.despesa import Despesa
from app.models.usuario import Usuario
from app import db

cartoes_bp = Blueprint('cartoes', __name__)

@cartoes_bp.route('/', methods=['GET'])
@jwt_required()
def listar_cartoes():
    # Parâmetros de filtro com tratamento de erros aprimorado
    try:
        ativo = request.args.get('ativo')
        if ativo is not None:
            ativo = ativo.lower() == 'true'
    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Parâmetro inválido: {str(e)}'}), 400
    
    # Consulta base
    query = Cartao.query
    
    # Aplicar filtros
    if ativo is not None:
        query = query.filter(Cartao.ativo == ativo)
    
    # Ordenar por nome
    cartoes = query.order_by(Cartao.nome).all()
    
    return jsonify([cartao.to_dict() for cartao in cartoes]), 200

@cartoes_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def obter_cartao(id):
    cartao = Cartao.query.get(id)
    
    if not cartao:
        return jsonify({'error': 'Cartão não encontrado'}), 404
    
    return jsonify(cartao.to_dict()), 200

@cartoes_bp.route('/', methods=['POST'])
@jwt_required()
def criar_cartao():
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(int(usuario_id))
    
    # Verificar se é admin
    if usuario.tipo != 'admin':
        return jsonify({'error': 'Permissão negada'}), 403
    
    data = request.get_json()
    
    # Validar dados obrigatórios
    campos_obrigatorios = ['nome', 'limite', 'dia_fechamento', 'dia_vencimento']
    
    for campo in campos_obrigatorios:
        if campo not in data:
            return jsonify({'error': f'Campo {campo} é obrigatório'}), 400
    
    # Validar valores
    try:
        limite = float(data['limite'])
        if limite < 0:
            return jsonify({'error': 'Limite não pode ser negativo'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Limite inválido'}), 400
    
    try:
        dia_fechamento = int(data['dia_fechamento'])
        if dia_fechamento < 1 or dia_fechamento > 31:
            return jsonify({'error': 'Dia de fechamento deve estar entre 1 e 31'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Dia de fechamento inválido'}), 400
    
    try:
        dia_vencimento = int(data['dia_vencimento'])
        if dia_vencimento < 1 or dia_vencimento > 31:
            return jsonify({'error': 'Dia de vencimento deve estar entre 1 e 31'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Dia de vencimento inválido'}), 400
    
    # Criar cartão
    novo_cartao = Cartao(
        nome=data['nome'],
        limite=limite,
        dia_fechamento=dia_fechamento,
        dia_vencimento=dia_vencimento,
        cor=data.get('cor', '#1976D2'),
        ativo=data.get('ativo', True)
    )
    
    db.session.add(novo_cartao)
    db.session.commit()
    
    return jsonify(novo_cartao.to_dict()), 201

@cartoes_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def atualizar_cartao(id):
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(int(usuario_id))
    
    # Verificar se é admin
    if usuario.tipo != 'admin':
        return jsonify({'error': 'Permissão negada'}), 403
    
    cartao = Cartao.query.get(id)
    if not cartao:
        return jsonify({'error': 'Cartão não encontrado'}), 404
    
    data = request.get_json()
    
    # Atualizar campos
    if 'nome' in data:
        cartao.nome = data['nome']
    
    if 'limite' in data:
        try:
            limite = float(data['limite'])
            if limite < 0:
                return jsonify({'error': 'Limite não pode ser negativo'}), 400
            cartao.limite = limite
        except (ValueError, TypeError):
            return jsonify({'error': 'Limite inválido'}), 400
    
    if 'dia_fechamento' in data:
        try:
            dia_fechamento = int(data['dia_fechamento'])
            if dia_fechamento < 1 or dia_fechamento > 31:
                return jsonify({'error': 'Dia de fechamento deve estar entre 1 e 31'}), 400
            cartao.dia_fechamento = dia_fechamento
        except (ValueError, TypeError):
            return jsonify({'error': 'Dia de fechamento inválido'}), 400
    
    if 'dia_vencimento' in data:
        try:
            dia_vencimento = int(data['dia_vencimento'])
            if dia_vencimento < 1 or dia_vencimento > 31:
                return jsonify({'error': 'Dia de vencimento deve estar entre 1 e 31'}), 400
            cartao.dia_vencimento = dia_vencimento
        except (ValueError, TypeError):
            return jsonify({'error': 'Dia de vencimento inválido'}), 400
    
    if 'cor' in data:
        cartao.cor = data['cor']
    
    if 'ativo' in data:
        cartao.ativo = data['ativo']
    
    db.session.commit()
    
    return jsonify(cartao.to_dict()), 200

@cartoes_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def excluir_cartao(id):
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(int(usuario_id))
    
    # Verificar se é admin
    if usuario.tipo != 'admin':
        return jsonify({'error': 'Permissão negada'}), 403
    
    cartao = Cartao.query.get(id)
    if not cartao:
        return jsonify({'error': 'Cartão não encontrado'}), 404
    
    # Verificar se há despesas associadas
    despesas = Despesa.query.filter_by(cartao_id=id).first()
    if despesas:
        return jsonify({'error': 'Não é possível excluir cartão com despesas associadas'}), 400
    
    db.session.delete(cartao)
    db.session.commit()
    
    return jsonify({'message': 'Cartão excluído com sucesso'}), 200

@cartoes_bp.route('/<int:id>/faturas', methods=['GET'])
@jwt_required()
def fatura_cartao(id):
    cartao = Cartao.query.get(id)
    if not cartao:
        return jsonify({'error': 'Cartão não encontrado'}), 404
    
    # Parâmetros com tratamento de erros seguro
    try:
        mes_str = request.args.get('mes')
        mes = int(mes_str) if mes_str and mes_str.strip() else None
        
        ano_str = request.args.get('ano')
        ano = int(ano_str) if ano_str and ano_str.strip() else None
    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Parâmetro inválido: {str(e)}'}), 400
    
    # Se não informados, usar data atual
    hoje = datetime.now()
    if not mes:
        mes = hoje.month
    if not ano:
        ano = hoje.year
    
    # Calcular data de fechamento da fatura
    dia_fechamento = cartao.dia_fechamento
    data_fechamento = datetime(ano, mes, dia_fechamento).date()
    
    # Se já passou do dia de fechamento, a fatura atual é do próximo mês
    if hoje.day > dia_fechamento:
        mes += 1
        if mes > 12:
            mes = 1
            ano += 1
        data_fechamento = datetime(ano, mes, dia_fechamento).date()
    
    # Calcular data de fechamento anterior
    mes_anterior = mes - 1
    ano_anterior = ano
    if mes_anterior < 1:
        mes_anterior = 12
        ano_anterior -= 1
    
    data_fechamento_anterior = datetime(ano_anterior, mes_anterior, dia_fechamento).date()
    
    # Buscar despesas da fatura
    despesas_fatura = Despesa.query.filter(
        Despesa.cartao_id == id,
        Despesa.data_compra > data_fechamento_anterior,
        Despesa.data_compra <= data_fechamento
    ).order_by(Despesa.data_compra).all()
    
    # Calcular valor total da fatura
    valor_total = sum(despesa.valor_total for despesa in despesas_fatura)
    
    # Calcular data de vencimento
    dia_vencimento = cartao.dia_vencimento
    mes_vencimento = mes
    ano_vencimento = ano
    
    if dia_vencimento < dia_fechamento:
        # Se o vencimento é antes do fechamento, o vencimento é no mês seguinte
        mes_vencimento += 1
        if mes_vencimento > 12:
            mes_vencimento = 1
            ano_vencimento += 1
    
    data_vencimento = datetime(ano_vencimento, mes_vencimento, dia_vencimento).date()
    
    # Preparar resposta
    fatura = {
        'cartao': cartao.to_dict(),
        'mes': mes,
        'ano': ano,
        'data_fechamento': data_fechamento.isoformat(),
        'data_vencimento': data_vencimento.isoformat(),
        'valor_total': valor_total,
        'despesas': [despesa.to_dict() for despesa in despesas_fatura]
    }
    
    return jsonify(fatura), 200

@cartoes_bp.route('/<int:id>/proximas_faturas', methods=['GET'])
@jwt_required()
def proximas_faturas(id):
    cartao = Cartao.query.get(id)
    if not cartao:
        return jsonify({'error': 'Cartão não encontrado'}), 404
    
    # Quantidade de faturas futuras a calcular com conversão segura
    try:
        quantidade_str = request.args.get('quantidade')
        quantidade = int(quantidade_str) if quantidade_str and quantidade_str.strip() else 3  # valor padrão
    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Parâmetro inválido: {str(e)}'}), 400
    
    hoje = datetime.now()
    faturas = []
    
    # Calcular data de fechamento atual
    ano = hoje.year
    mes = hoje.month
    
    # Se já passou do dia de fechamento, a próxima fatura fecha no próximo mês
    if hoje.day > cartao.dia_fechamento:
        mes += 1
        if mes > 12:
            mes = 1
            ano += 1
    
    # Calcular próximas faturas
    for i in range(quantidade):
        # Calcular data de fechamento
        data_fechamento = datetime(ano, mes, cartao.dia_fechamento).date()
        
        # Calcular data de vencimento
        mes_vencimento = mes
        ano_vencimento = ano
        
        if cartao.dia_vencimento < cartao.dia_fechamento:
            # Se o vencimento é antes do fechamento, o vencimento é no mês seguinte
            mes_vencimento += 1
            if mes_vencimento > 12:
                mes_vencimento = 1
                ano_vencimento += 1
        
        data_vencimento = datetime(ano_vencimento, mes_vencimento, cartao.dia_vencimento).date()
        
        # Calcular data de fechamento anterior
        mes_anterior = mes - 1
        ano_anterior = ano
        if mes_anterior < 1:
            mes_anterior = 12
            ano_anterior -= 1
        
        data_fechamento_anterior = datetime(ano_anterior, mes_anterior, cartao.dia_fechamento).date()
        
        # Buscar despesas da fatura
        despesas_fatura = Despesa.query.filter(
            Despesa.cartao_id == id,
            Despesa.data_compra > data_fechamento_anterior,
            Despesa.data_compra <= data_fechamento
        ).all()
        
        # Calcular valor total da fatura
        valor_total = sum(despesa.valor_total for despesa in despesas_fatura)
        
        # Adicionar fatura à lista
        faturas.append({
            'mes': mes,
            'ano': ano,
            'data_fechamento': data_fechamento.isoformat(),
            'data_vencimento': data_vencimento.isoformat(),
            'valor_total': valor_total,
            'quantidade_despesas': len(despesas_fatura)
        })
        
        # Avançar para o próximo mês
        mes += 1
        if mes > 12:
            mes = 1
            ano += 1
    
    return jsonify(faturas), 200
