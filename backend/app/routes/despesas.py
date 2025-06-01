from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.despesa import Despesa
from app.models.categoria import Categoria
from app.models.usuario import Usuario
from app.models.cartao import Cartao
from app import db
from datetime import datetime, timedelta
import calendar

despesas_bp = Blueprint('despesas', __name__) 

@despesas_bp.route('/', methods=['GET'])
@jwt_required()
def listar_despesas():
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(int(usuario_id))
    
    # Parâmetros de filtro com conversão segura
    mes_str = request.args.get('mes')
    mes = int(mes_str) if mes_str and mes_str.strip() else None

    ano_str = request.args.get('ano')
    ano = int(ano_str) if ano_str and ano_str.strip() else None

    categoria_id_str = request.args.get('categoria_id')
    categoria_id = int(categoria_id_str) if categoria_id_str and categoria_id_str.strip() else None

    tipo_despesa = request.args.get('tipo_despesa')
    tipo_despesa = tipo_despesa if tipo_despesa and tipo_despesa.strip() else None
    
    status = request.args.get('status')
    status = status if status and status.strip() else None
    
    busca = request.args.get('busca')
    busca = busca if busca and busca.strip() else None
    
    # Consulta base
    query = Despesa.query
    
    # Aplicar filtros
    if mes and ano:
        primeiro_dia = datetime(ano, mes, 1).date()
        ultimo_dia = datetime(ano, mes, calendar.monthrange(ano, mes)[1]).date()
        query = query.filter(Despesa.data_vencimento >= primeiro_dia, 
                            Despesa.data_vencimento <= ultimo_dia)
    
    if categoria_id:
        query = query.filter(Despesa.categoria_id == categoria_id)
    
    if tipo_despesa:
        query = query.filter(Despesa.tipo_despesa == tipo_despesa)
    
    if status:
        query = query.filter(Despesa.status == status)
    
    if busca:
        query = query.filter(
            (Despesa.descricao.ilike(f'%{busca}%')) | 
            (Despesa.origem.ilike(f'%{busca}%'))
        )
    
    # Ordenar por data de vencimento
    despesas = query.order_by(Despesa.data_vencimento).all()
    
    return jsonify([despesa.to_dict() for despesa in despesas]), 200

@despesas_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def obter_despesa(id):
    despesa = Despesa.query.get(id)
    
    if not despesa:
        return jsonify({'error': 'Despesa não encontrada'}), 404
    
    return jsonify(despesa.to_dict()), 200

@despesas_bp.route('/', methods=['POST'])
@jwt_required()
def criar_despesa():
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(int(usuario_id))
    
    # Verificar se é admin
    if usuario.tipo != 'admin':
        return jsonify({'error': 'Permissão negada'}), 403
    
    data = request.get_json()
    
    # Validar dados obrigatórios
    campos_obrigatorios = ['descricao', 'categoria_id', 'valor_total', 
                          'data_compra', 'data_vencimento', 'pago_por_id', 
                          'tipo_despesa']
    
    for campo in campos_obrigatorios:
        if campo not in data:
            return jsonify({'error': f'Campo {campo} é obrigatório'}), 400
    
    # Converter datas de string para objeto date
    try:
        data_compra = datetime.fromisoformat(data['data_compra']).date()
        data_vencimento = datetime.fromisoformat(data['data_vencimento']).date()
    except ValueError:
        return jsonify({'error': 'Formato de data inválido'}), 400
    
    # Verificar se categoria existe
    categoria = Categoria.query.get(data['categoria_id'])
    if not categoria:
        return jsonify({'error': 'Categoria não encontrada'}), 404
    
    # Verificar se usuário pagador existe
    pago_por = Usuario.query.get(data['pago_por_id'])
    if not pago_por:
        return jsonify({'error': 'Usuário pagador não encontrado'}), 404
    
    # Verificar cartão se informado
    cartao_id = data.get('cartao_id')
    if cartao_id:
        cartao = Cartao.query.get(cartao_id)
        if not cartao:
            return jsonify({'error': 'Cartão não encontrado'}), 404
    
    # Calcular valor dividido (igual para todos os investidores)
    investidores = Usuario.query.filter_by(tipo='investidor', ativo=True).count()
    valor_dividido = data['valor_total'] / investidores if investidores > 0 else data['valor_total']
    
    # Criar despesa base
    nova_despesa = Despesa(
        origem=data.get('origem', ''),
        descricao=data['descricao'],
        categoria_id=data['categoria_id'],
        valor_total=data['valor_total'],
        valor_dividido=valor_dividido,
        data_compra=data_compra,
        data_vencimento=data_vencimento,
        forma_pagamento=data.get('forma_pagamento', ''),
        cartao_id=cartao_id,
        pago_por_id=data['pago_por_id'],
        status=data.get('status', 'pendente'),
        tipo_despesa=data['tipo_despesa']
    )
    
    # Configurações específicas por tipo de despesa
    if data['tipo_despesa'] == 'recorrente':
        nova_despesa.frequencia = data.get('frequencia', 'mensal')
    elif data['tipo_despesa'] == 'parcelada':
        nova_despesa.total_parcelas = data.get('total_parcelas', 1)
        nova_despesa.parcela_atual = 1
    
    db.session.add(nova_despesa)
    db.session.commit()
    
    # Criar parcelas ou recorrências futuras se necessário
    if data['tipo_despesa'] == 'parcelada' and nova_despesa.total_parcelas > 1:
        criar_parcelas(nova_despesa)
    elif data['tipo_despesa'] == 'recorrente' and data.get('gerar_recorrencias', False):
        criar_recorrencias(nova_despesa, data.get('quantidade_recorrencias', 12))
    
    return jsonify(nova_despesa.to_dict()), 201

@despesas_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def atualizar_despesa(id):
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(int(usuario_id))
    
    # Verificar se é admin
    if usuario.tipo != 'admin':
        return jsonify({'error': 'Permissão negada'}), 403
    
    despesa = Despesa.query.get(id)
    if not despesa:
        return jsonify({'error': 'Despesa não encontrada'}), 404
    
    data = request.get_json()
    
    # Atualizar campos
    if 'descricao' in data:
        despesa.descricao = data['descricao']
    
    if 'origem' in data:
        despesa.origem = data['origem']
    
    if 'categoria_id' in data:
        categoria = Categoria.query.get(data['categoria_id'])
        if not categoria:
            return jsonify({'error': 'Categoria não encontrada'}), 404
        despesa.categoria_id = data['categoria_id']
    
    if 'valor_total' in data:
        despesa.valor_total = data['valor_total']
        # Recalcular valor dividido
        investidores = Usuario.query.filter_by(tipo='investidor', ativo=True).count()
        despesa.valor_dividido = despesa.valor_total / investidores if investidores > 0 else despesa.valor_total
    
    if 'data_compra' in data:
        try:
            despesa.data_compra = datetime.fromisoformat(data['data_compra']).date()
        except ValueError:
            return jsonify({'error': 'Formato de data de compra inválido'}), 400
    
    if 'data_vencimento' in data:
        try:
            despesa.data_vencimento = datetime.fromisoformat(data['data_vencimento']).date()
        except ValueError:
            return jsonify({'error': 'Formato de data de vencimento inválido'}), 400
    
    if 'forma_pagamento' in data:
        despesa.forma_pagamento = data['forma_pagamento']
    
    if 'cartao_id' in data:
        if data['cartao_id']:
            cartao = Cartao.query.get(data['cartao_id'])
            if not cartao:
                return jsonify({'error': 'Cartão não encontrado'}), 404
        despesa.cartao_id = data['cartao_id']
    
    if 'pago_por_id' in data:
        pago_por = Usuario.query.get(data['pago_por_id'])
        if not pago_por:
            return jsonify({'error': 'Usuário pagador não encontrado'}), 404
        despesa.pago_por_id = data['pago_por_id']
    
    if 'status' in data:
        despesa.status = data['status']
    
    # Atualizar campos específicos por tipo
    if despesa.tipo_despesa == 'recorrente' and 'frequencia' in data:
        despesa.frequencia = data['frequencia']
    
    if despesa.tipo_despesa == 'parcelada':
        if 'total_parcelas' in data:
            despesa.total_parcelas = data['total_parcelas']
        if 'parcela_atual' in data:
            despesa.parcela_atual = data['parcela_atual']
    
    # Atualizar parcelas ou recorrências futuras se solicitado
    atualizar_futuras = data.get('atualizar_futuras', False)
    if atualizar_futuras and despesa.despesa_pai_id is None:  # Só atualiza se for despesa pai
        if despesa.tipo_despesa == 'parcelada':
            atualizar_parcelas_futuras(despesa)
        elif despesa.tipo_despesa == 'recorrente':
            atualizar_recorrencias_futuras(despesa)
    
    db.session.commit()
    
    return jsonify(despesa.to_dict()), 200

@despesas_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def excluir_despesa(id):
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(int(usuario_id))
    
    # Verificar se é admin
    if usuario.tipo != 'admin':
        return jsonify({'error': 'Permissão negada'}), 403
    
    despesa = Despesa.query.get(id)
    if not despesa:
        return jsonify({'error': 'Despesa não encontrada'}), 404
    
    # Verificar se tem despesas filhas
    excluir_futuras_str = request.args.get('excluir_futuras', 'false')
    excluir_futuras = excluir_futuras_str.lower() == 'true'
    
    if excluir_futuras:
        # Excluir todas as despesas filhas
        Despesa.query.filter_by(despesa_pai_id=id).delete()
    else:
        # Verificar se tem despesas filhas pendentes
        despesas_filhas_pendentes = Despesa.query.filter_by(
            despesa_pai_id=id, 
            status='pendente'
        ).count()
        
        if despesas_filhas_pendentes > 0:
            return jsonify({
                'error': 'Esta despesa possui parcelas ou recorrências futuras pendentes',
                'despesas_filhas_pendentes': despesas_filhas_pendentes
            }), 400
    
    db.session.delete(despesa)
    db.session.commit()
    
    return jsonify({'message': 'Despesa excluída com sucesso'}), 200

@despesas_bp.route('/calendario', methods=['GET'])
@jwt_required()
def calendario():
    mes_str = request.args.get('mes')
    mes = int(mes_str) if mes_str and mes_str.strip() else datetime.now().month
    
    ano_str = request.args.get('ano')
    ano = int(ano_str) if ano_str and ano_str.strip() else datetime.now().year
    
    # Obter primeiro e último dia do mês
    primeiro_dia = datetime(ano, mes, 1).date()
    ultimo_dia = datetime(ano, mes, calendar.monthrange(ano, mes)[1]).date()
    
    # Buscar despesas do mês
    despesas = Despesa.query.filter(
        Despesa.data_vencimento >= primeiro_dia,
        Despesa.data_vencimento <= ultimo_dia
    ).order_by(Despesa.data_vencimento).all()
    
    # Organizar por dia
    calendario_data = {}
    for despesa in despesas:
        dia = despesa.data_vencimento.day
        if dia not in calendario_data:
            calendario_data[dia] = []
        
        calendario_data[dia].append(despesa.to_dict())
    
    return jsonify(calendario_data), 200

# Funções auxiliares
def criar_parcelas(despesa_pai):
    """Cria as parcelas futuras de uma despesa parcelada"""
    if not despesa_pai.total_parcelas or despesa_pai.total_parcelas <= 1:
        return
    
    # Determinar intervalo entre parcelas (geralmente 1 mês)
    intervalo = timedelta(days=30)
    
    for i in range(2, despesa_pai.total_parcelas + 1):
        # Calcular data de vencimento da parcela
        data_vencimento = despesa_pai.data_vencimento + intervalo * (i - 1)
        
        # Criar parcela
        parcela = Despesa(
            origem=despesa_pai.origem,
            descricao=f"{despesa_pai.descricao} ({i}/{despesa_pai.total_parcelas})",
            categoria_id=despesa_pai.categoria_id,
            valor_total=despesa_pai.valor_total,
            valor_dividido=despesa_pai.valor_dividido,
            data_compra=despesa_pai.data_compra,
            data_vencimento=data_vencimento,
            forma_pagamento=despesa_pai.forma_pagamento,
            cartao_id=despesa_pai.cartao_id,
            pago_por_id=despesa_pai.pago_por_id,
            status='pendente',
            tipo_despesa='parcelada',
            total_parcelas=despesa_pai.total_parcelas,
            parcela_atual=i,
            despesa_pai_id=despesa_pai.id
        )
        
        db.session.add(parcela)
    
    db.session.commit()

def criar_recorrencias(despesa_pai, quantidade=12):
    """Cria as recorrências futuras de uma despesa recorrente"""
    if not despesa_pai.frequencia:
        return
    
    # Determinar intervalo baseado na frequência
    if despesa_pai.frequencia == 'mensal':
        meses_intervalo = 1
    elif despesa_pai.frequencia == 'bimestral':
        meses_intervalo = 2
    elif despesa_pai.frequencia == 'trimestral':
        meses_intervalo = 3
    elif despesa_pai.frequencia == 'semestral':
        meses_intervalo = 6
    elif despesa_pai.frequencia == 'anual':
        meses_intervalo = 12
    else:
        meses_intervalo = 1  # Padrão mensal
    
    for i in range(1, quantidade + 1):
        # Calcular data de vencimento da recorrência
        mes_atual = despesa_pai.data_vencimento.month + (meses_intervalo * i)
        ano_atual = despesa_pai.data_vencimento.year + ((mes_atual - 1) // 12)
        mes_atual = ((mes_atual - 1) % 12) + 1
        
        # Ajustar dia para não ultrapassar o último dia do mês
        dia = min(despesa_pai.data_vencimento.day, calendar.monthrange(ano_atual, mes_atual)[1])
        
        data_vencimento = datetime(ano_atual, mes_atual, dia).date()
        
        # Criar recorrência
        recorrencia = Despesa(
            origem=despesa_pai.origem,
            descricao=despesa_pai.descricao,
            categoria_id=despesa_pai.categoria_id,
            valor_total=despesa_pai.valor_total,
            valor_dividido=despesa_pai.valor_dividido,
            data_compra=data_vencimento - timedelta(days=5),  # Estimativa
            data_vencimento=data_vencimento,
            forma_pagamento=despesa_pai.forma_pagamento,
            cartao_id=despesa_pai.cartao_id,
            pago_por_id=despesa_pai.pago_por_id,
            status='pendente',
            tipo_despesa='recorrente',
            frequencia=despesa_pai.frequencia,
            despesa_pai_id=despesa_pai.id
        )
        
        db.session.add(recorrencia)
    
    db.session.commit()

def atualizar_parcelas_futuras(despesa_pai):
    """Atualiza as parcelas futuras de uma despesa parcelada"""
    parcelas_futuras = Despesa.query.filter_by(
        despesa_pai_id=despesa_pai.id,
        status='pendente'
    ).all()
    
    for parcela in parcelas_futuras:
        parcela.origem = despesa_pai.origem
        parcela.descricao = f"{despesa_pai.descricao} ({parcela.parcela_atual}/{despesa_pai.total_parcelas})"
        parcela.categoria_id = despesa_pai.categoria_id
        parcela.valor_total = despesa_pai.valor_total
        parcela.valor_dividido = despesa_pai.valor_dividido
        parcela.forma_pagamento = despesa_pai.forma_pagamento
        parcela.cartao_id = despesa_pai.cartao_id
        parcela.pago_por_id = despesa_pai.pago_por_id
        parcela.total_parcelas = despesa_pai.total_parcelas
    
    db.session.commit()

def atualizar_recorrencias_futuras(despesa_pai):
    """Atualiza as recorrências futuras de uma despesa recorrente"""
    recorrencias_futuras = Despesa.query.filter_by(
        despesa_pai_id=despesa_pai.id,
        status='pendente'
    ).all()
    
    for recorrencia in recorrencias_futuras:
        recorrencia.origem = despesa_pai.origem
        recorrencia.descricao = despesa_pai.descricao
        recorrencia.categoria_id = despesa_pai.categoria_id
        recorrencia.valor_total = despesa_pai.valor_total
        recorrencia.valor_dividido = despesa_pai.valor_dividido
        recorrencia.forma_pagamento = despesa_pai.forma_pagamento
        recorrencia.cartao_id = despesa_pai.cartao_id
        recorrencia.pago_por_id = despesa_pai.pago_por_id
        recorrencia.frequencia = despesa_pai.frequencia
    
    db.session.commit()
