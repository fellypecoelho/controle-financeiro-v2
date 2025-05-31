from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.despesa import Despesa
from app.models.aporte import Aporte
from app.models.usuario import Usuario
from app.models.categoria import Categoria
from app import db
from datetime import datetime, timedelta
import calendar

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/resumo', methods=['GET'])
@jwt_required()
def resumo():
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(usuario_id)
    
    # Parâmetros de filtro
    mes = request.args.get('mes', type=int, default=datetime.now().month)
    ano = request.args.get('ano', type=int, default=datetime.now().year)
    
    # Obter primeiro e último dia do mês
    primeiro_dia = datetime(ano, mes, 1).date()
    ultimo_dia = datetime(ano, mes, calendar.monthrange(ano, mes)[1]).date()
    
    # Resumo de despesas do mês
    despesas_mes = Despesa.query.filter(
        Despesa.data_vencimento >= primeiro_dia,
        Despesa.data_vencimento <= ultimo_dia
    ).all()
    
    total_despesas_mes = sum(despesa.valor_total for despesa in despesas_mes)
    total_despesas_pagas = sum(despesa.valor_total for despesa in despesas_mes if despesa.status == 'pago')
    total_despesas_pendentes = sum(despesa.valor_total for despesa in despesas_mes if despesa.status == 'pendente')
    
    # Despesas por categoria
    despesas_por_categoria = {}
    for despesa in despesas_mes:
        categoria_id = despesa.categoria_id
        if categoria_id not in despesas_por_categoria:
            categoria = Categoria.query.get(categoria_id)
            despesas_por_categoria[categoria_id] = {
                'categoria': categoria.to_dict(),
                'total': 0
            }
        despesas_por_categoria[categoria_id]['total'] += despesa.valor_total
    
    # Aportes do mês
    aportes_mes = Aporte.query.filter(
        Aporte.data >= primeiro_dia,
        Aporte.data <= ultimo_dia
    ).all()
    
    total_aportes_mes = sum(aporte.valor for aporte in aportes_mes)
    
    # Saldos dos investidores
    investidores = Usuario.query.filter_by(tipo='investidor', ativo=True).all()
    saldos = []
    
    for investidor in investidores:
        # Total de aportes
        total_aportes = sum(aporte.valor for aporte in investidor.aportes)
        
        # Total de despesas divididas (valor dividido por investidor)
        total_despesas_divididas = db.session.query(
            db.func.sum(Despesa.valor_dividido)
        ).filter(Despesa.status == 'pago').scalar() or 0
        
        # Calcular saldo
        saldo = total_aportes - total_despesas_divididas
        
        saldos.append({
            'usuario': investidor.to_dict(),
            'saldo': saldo
        })
    
    # Próximos vencimentos
    hoje = datetime.now().date()
    proximos_dias = hoje + timedelta(days=7)
    
    proximos_vencimentos = Despesa.query.filter(
        Despesa.data_vencimento >= hoje,
        Despesa.data_vencimento <= proximos_dias,
        Despesa.status == 'pendente'
    ).order_by(Despesa.data_vencimento).all()
    
    # Preparar resposta
    resumo = {
        'mes': mes,
        'ano': ano,
        'total_despesas_mes': total_despesas_mes,
        'total_despesas_pagas': total_despesas_pagas,
        'total_despesas_pendentes': total_despesas_pendentes,
        'despesas_por_categoria': list(despesas_por_categoria.values()),
        'total_aportes_mes': total_aportes_mes,
        'saldos': saldos,
        'proximos_vencimentos': [despesa.to_dict() for despesa in proximos_vencimentos]
    }
    
    return jsonify(resumo), 200

@dashboard_bp.route('/evolucao', methods=['GET'])
@jwt_required()
def evolucao():
    # Parâmetros de filtro
    meses = request.args.get('meses', type=int, default=6)
    
    # Data atual
    hoje = datetime.now().date()
    mes_atual = hoje.month
    ano_atual = hoje.year
    
    # Preparar dados de evolução
    evolucao_despesas = []
    evolucao_aportes = []
    
    for i in range(meses):
        # Calcular mês e ano
        mes = mes_atual - i
        ano = ano_atual
        
        while mes <= 0:
            mes += 12
            ano -= 1
        
        # Obter primeiro e último dia do mês
        primeiro_dia = datetime(ano, mes, 1).date()
        ultimo_dia = datetime(ano, mes, calendar.monthrange(ano, mes)[1]).date()
        
        # Total de despesas do mês
        despesas_mes = Despesa.query.filter(
            Despesa.data_vencimento >= primeiro_dia,
            Despesa.data_vencimento <= ultimo_dia
        ).all()
        
        total_despesas = sum(despesa.valor_total for despesa in despesas_mes)
        
        # Total de aportes do mês
        aportes_mes = Aporte.query.filter(
            Aporte.data >= primeiro_dia,
            Aporte.data <= ultimo_dia
        ).all()
        
        total_aportes = sum(aporte.valor for aporte in aportes_mes)
        
        # Adicionar aos dados de evolução
        evolucao_despesas.append({
            'mes': mes,
            'ano': ano,
            'total': total_despesas
        })
        
        evolucao_aportes.append({
            'mes': mes,
            'ano': ano,
            'total': total_aportes
        })
    
    # Inverter para ordem cronológica
    evolucao_despesas.reverse()
    evolucao_aportes.reverse()
    
    return jsonify({
        'evolucao_despesas': evolucao_despesas,
        'evolucao_aportes': evolucao_aportes
    }), 200
