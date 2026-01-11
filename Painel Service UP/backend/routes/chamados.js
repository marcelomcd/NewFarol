import express from 'express';
import { getConnection } from '../db/connection.js';

const router = express.Router();

// Helper para construir filtro de data
const buildDateFilter = (month, year, startDate, endDate, field = 'created') => {
    // Prioridade: se startDate e endDate estiverem presentes, usar range
    if (startDate && endDate && startDate !== 'null' && endDate !== 'null') {
        // Garantir que endDate inclui o final do dia
        const endDateTime = endDate.includes(' ') ? endDate : `${endDate} 23:59:59`;
        return `${field} >= '${startDate}' AND ${field} <= '${endDateTime}'`;
    }
    // Se não, usar month/year
    // month = 0, null ou undefined significa "Todos os meses"
    const monthNum = (month !== null && month !== undefined && month !== 'null' && month !== '') ? parseInt(month) : null;
    const yearNum = (year !== null && year !== undefined && year !== 'null' && year !== '') ? parseInt(year) : null;

    if (monthNum && monthNum !== 0 && yearNum) {
        // Mês e ano específicos
        return `YEAR(${field}) = ${yearNum} AND MONTH(${field}) = ${monthNum}`;
    } else if (yearNum && (!monthNum || monthNum === 0)) {
        // Apenas ano (todos os meses do ano) - month = 0, null ou undefined
        return `YEAR(${field}) = ${yearNum}`;
    } else if (monthNum && monthNum !== 0 && !yearNum) {
        // Apenas mês (ano atual)
        const currentYear = new Date().getFullYear();
        return `YEAR(${field}) = ${currentYear} AND MONTH(${field}) = ${monthNum}`;
    }
    // Padrão: ano atual completo
    const currentYear = new Date().getFullYear();
    return `YEAR(${field}) = ${currentYear}`;
};

// Helper para construir filtro de analista
const buildAnalistaFilter = (analistaFilter, analistasSelecionados) => {
    // Lista de analistas QualiIT normalizados (sem prefixos)
    const analistasQualiITNormalizados = [
        'Adriano Santos',
        'Alessandra Pardin',
        'Arthur Nagae',
        'Diego Moraes Leal',
        'João Carlos Ribeiro',
        'Juliana Jesus de Oliveira',
        'Leonardo Dos Santos Caetano',
        'Lucas Algarve da Silva',
        'Luiz Alberto Duarte de Sousa',
        'Lucas Mendes',
        'Jefferson Vieira',
        'Luiz Fernando',
        'Roberto Leandro',
        'Rosiléa Pereira de Toledo Campo'
    ];

    if (!analistaFilter || analistaFilter === 'todos' || analistaFilter === 'null') {
        return ''; // Sem filtro
    } else if (analistaFilter === 'qualiit') {
        // Filtra todos os analistas QualiIT usando normalização (apenas owner_name)
        // Normaliza removendo prefixos "Qualiit - ", "Qualiit - " e "Quallit - " antes de comparar
        const lista = analistasQualiITNormalizados.map(a => `'${a.replace(/'/g, "''")}'`).join(', ');
        return `TRIM(REPLACE(REPLACE(REPLACE(owner_name, 'Qualiit - ', ''), 'Qualiit - ', ''), 'Quallit - ', '')) IN (${lista})`;
    } else if (analistaFilter === 'analistas' && analistasSelecionados && analistasSelecionados.length > 0) {
        // Filtra analistas selecionados (normaliza os nomes selecionados também)
        const lista = analistasSelecionados.map(a => {
            const nomeNormalizado = a.replace(/^(Qualiit - |Qualiit - |Quallit - )/, '');
            return `'${nomeNormalizado.replace(/'/g, "''")}'`;
        }).join(', ');
        return `TRIM(REPLACE(REPLACE(REPLACE(owner_name, 'Qualiit - ', ''), 'Qualiit - ', ''), 'Quallit - ', '')) IN (${lista})`;
    }
    return ''; // Padrão: sem filtro
};

// Helper para construir filtro de analista para tabela de satisfação (usa Owner)
const buildAnalistaFilterSatisfacao = (analistaFilter, analistasSelecionados) => {
    // Lista de analistas QualiIT normalizados (sem prefixos)
    const analistasQualiITNormalizados = [
        'Adriano Santos',
        'Alessandra Pardin',
        'Arthur Nagae',
        'Diego Moraes Leal',
        'João Carlos Ribeiro',
        'Juliana Jesus de Oliveira',
        'Leonardo Dos Santos Caetano',
        'Lucas Algarve da Silva',
        'Luiz Alberto Duarte de Sousa',
        'Lucas Mendes',
        'Jefferson Vieira',
        'Luiz Fernando',
        'Roberto Leandro',
        'Rosiléa Pereira de Toledo Campo'
    ];

    if (!analistaFilter || analistaFilter === 'todos' || analistaFilter === 'null') {
        return ''; // Sem filtro
    } else if (analistaFilter === 'qualiit') {
        // Filtra todos os analistas QualiIT usando normalização no campo Owner
        // Normaliza removendo prefixos "Qualiit - ", "Qualiit - " e "Quallit - " antes de comparar
        const lista = analistasQualiITNormalizados.map(a => `'${a.replace(/'/g, "''")}'`).join(', ');
        return `TRIM(REPLACE(REPLACE(REPLACE(Owner, 'Qualiit - ', ''), 'Qualiit - ', ''), 'Quallit - ', '')) IN (${lista})`;
    } else if (analistaFilter === 'analistas' && analistasSelecionados && analistasSelecionados.length > 0) {
        // Filtra analistas selecionados (normaliza os nomes selecionados também)
        const lista = analistasSelecionados.map(a => {
            const nomeNormalizado = a.replace(/^(Qualiit - |Qualiit - |Quallit - )/, '');
            return `'${nomeNormalizado.replace(/'/g, "''")}'`;
        }).join(', ');
        return `TRIM(REPLACE(REPLACE(REPLACE(Owner, 'Qualiit - ', ''), 'Qualiit - ', ''), 'Quallit - ', '')) IN (${lista})`;
    }
    return '';
};

// Helper para normalizar nome de analista (remove prefixos Qualiit)
const normalizeAnalistaName = (fieldName) => {
    return `TRIM(REPLACE(REPLACE(REPLACE(${fieldName}, 'Qualiit - ', ''), 'Qualiit - ', ''), 'Quallit - ', ''))`;
};

// GET - Chamados atendidos (evolução mensal)
router.get('/atendidos', async (req, res) => {
    try {
        const connection = getConnection();
        const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;

        // Para este endpoint, quando year estiver presente e válido, sempre filtrar estritamente pelo ano
        // Isso garante que apenas dados do ano selecionado sejam retornados
        let dateFilter = '';
        if (year && year !== 'null' && year !== '' && year !== null && year !== undefined) {
            // Quando year está presente, filtrar estritamente pelo ano (ignorar startDate/endDate)
            const yearNum = parseInt(year);
            if (!isNaN(yearNum)) {
                dateFilter = `YEAR(created) = ${yearNum}`;
            } else {
                // Se year não for um número válido, usar buildDateFilter
                dateFilter = buildDateFilter(month, year, startDate, endDate, 'created');
            }
        } else {
            // Se year não estiver presente, usar buildDateFilter (prioriza startDate/endDate se presentes)
            dateFilter = buildDateFilter(month, year, startDate, endDate, 'created');
        }

        const analistaFilterSQL = buildAnalistaFilter(analistaFilter, analistas ? JSON.parse(analistas) : []);

        const query = `
            SELECT 
                DATE_FORMAT(created, '%b/%y') as mes,
                COUNT(*) as chamados,
                SUM(CASE WHEN queue_name LIKE '%N1%' THEN 1 ELSE 0 END) as n1,
                SUM(CASE WHEN queue_name LIKE '%N2%' THEN 1 ELSE 0 END) as n2
            FROM dw_combio.bi_chamados_service_up
            WHERE ${dateFilter}
                ${analistaFilterSQL ? `AND ${analistaFilterSQL}` : ''}
                AND created IS NOT NULL
            GROUP BY DATE_FORMAT(created, '%Y-%m'), DATE_FORMAT(created, '%b/%y')
            ORDER BY DATE_FORMAT(created, '%Y-%m') ASC
        `;

        const [rows] = await connection.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar chamados atendidos:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Chamados aberto x fechado
router.get('/aberto-fechado', async (req, res) => {
    try {
        const connection = getConnection();
        const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;

        // Construir filtros separados: fechados por closed, abertos por created
        // buildDateFilter já retorna o ano atual como padrão quando não há filtros
        const dateFilterFechados = buildDateFilter(month, year, startDate, endDate, 'closed');
        const dateFilterAbertos = buildDateFilter(month, year, startDate, endDate, 'created');
        const analistaFilterSQL = buildAnalistaFilter(analistaFilter, analistas ? JSON.parse(analistas) : []);

        // Query para chamados FECHADOS (agrupados por mês de FECHAMENTO - coluna closed)
        // Conta todos os chamados que foram fechados no mês, independente do estado atual
        const queryFechados = `
            SELECT 
                DATE_FORMAT(closed, '%Y-%m') as mes,
                COUNT(*) as fechado
            FROM dw_combio.bi_chamados_service_up
            WHERE ${dateFilterFechados}
                ${analistaFilterSQL ? `AND ${analistaFilterSQL}` : ''}
                AND closed IS NOT NULL
            GROUP BY DATE_FORMAT(closed, '%Y-%m')
        `;

        // Query para chamados ABERTOS (agrupados por mês de CRIAÇÃO - coluna created)
        // Conta todos os chamados que foram criados no mês, independente do estado atual
        const queryAbertos = `
            SELECT 
                DATE_FORMAT(created, '%Y-%m') as mes,
                COUNT(*) as aberto
            FROM dw_combio.bi_chamados_service_up
            WHERE ${dateFilterAbertos}
                ${analistaFilterSQL ? `AND ${analistaFilterSQL}` : ''}
                AND created IS NOT NULL
            GROUP BY DATE_FORMAT(created, '%Y-%m')
        `;

        const [fechados] = await connection.query(queryFechados);
        const [abertos] = await connection.query(queryAbertos);

        // Combinar os resultados por mês
        const mesesMap = new Map();

        // Adicionar fechados ao mapa
        fechados.forEach(row => {
            mesesMap.set(row.mes, {
                mes: row.mes,
                fechado: Number(row.fechado) || 0,
                aberto: 0
            });
        });

        // Adicionar abertos ao mapa (ou atualizar se o mês já existir)
        abertos.forEach(row => {
            const mes = row.mes;
            if (mesesMap.has(mes)) {
                mesesMap.get(mes).aberto = Number(row.aberto) || 0;
            } else {
                mesesMap.set(mes, {
                    mes: mes,
                    fechado: 0,
                    aberto: Number(row.aberto) || 0
                });
            }
        });

        // Converter para array e ordenar por mês
        const result = Array.from(mesesMap.values()).sort((a, b) => a.mes.localeCompare(b.mes));

        res.json(result);
    } catch (error) {
        console.error('Erro ao buscar chamados aberto/fechado:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// DASHBOARD DE CHAMADOS - 6 ENDPOINTS
// ============================================

// GET - Dashboard: Chamados por Status (state_name diferente de Encerrado)
router.get('/dashboard/status', async (req, res) => {
    try {
        const connection = getConnection();
        const { ticket, analistaFilter, analistas } = req.query;

        let whereClause = `state_name != 'Encerrado' AND state_name != 'Open' AND state_name != 'merged' AND state_name IS NOT NULL`;

        // Filtro por analista
        const analistaFilterSQL = buildAnalistaFilter(analistaFilter, analistas ? JSON.parse(analistas) : []);
        if (analistaFilterSQL) {
            whereClause += ` AND ${analistaFilterSQL}`;
        }

        // Filtro por ticket específico
        if (ticket && ticket !== 'null' && ticket !== '') {
            whereClause += ` AND ticket_id = '${ticket.replace(/'/g, "''")}'`;
        }

        const query = `
            SELECT 
                state_name as status,
                COUNT(*) as quantidade
            FROM dw_combio.bi_chamados_service_up
            WHERE ${whereClause}
            GROUP BY state_name
            ORDER BY quantidade DESC
        `;

        const [rows] = await connection.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar chamados por status:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Dashboard: Tempo de Chamado Aberto (baseado em created com semáforo)
router.get('/dashboard/tempo-aberto', async (req, res) => {
    try {
        const connection = getConnection();
        const { ticket, analistaFilter, analistas } = req.query;

        let whereClause = `state_name != 'Encerrado' AND created IS NOT NULL`;

        // Filtro por analista
        const analistaFilterSQL = buildAnalistaFilter(analistaFilter, analistas ? JSON.parse(analistas) : []);
        if (analistaFilterSQL) {
            whereClause += ` AND ${analistaFilterSQL}`;
        }

        // Filtro por ticket específico
        if (ticket && ticket !== 'null' && ticket !== '') {
            whereClause += ` AND ticket_id = '${ticket.replace(/'/g, "''")}'`;
        }

        const query = `
            SELECT 
                CASE 
                    WHEN DATEDIFF(NOW(), created) <= 1 THEN 'Até 1 dia'
                    WHEN DATEDIFF(NOW(), created) BETWEEN 2 AND 5 THEN 'De 2 a 5 dias'
                    WHEN DATEDIFF(NOW(), created) BETWEEN 6 AND 10 THEN 'De 6 a 10 dias'
                    WHEN DATEDIFF(NOW(), created) BETWEEN 11 AND 20 THEN 'De 11 a 20 dias'
                    WHEN DATEDIFF(NOW(), created) BETWEEN 21 AND 30 THEN 'De 21 a 30 dias'
                    WHEN DATEDIFF(NOW(), created) > 30 THEN 'Mais de 30 dias'
                END as categoria,
                CASE 
                    WHEN DATEDIFF(NOW(), created) <= 1 THEN 'verde'
                    WHEN DATEDIFF(NOW(), created) BETWEEN 2 AND 5 THEN 'amarelo'
                    WHEN DATEDIFF(NOW(), created) BETWEEN 6 AND 10 THEN 'amarelo'
                    WHEN DATEDIFF(NOW(), created) BETWEEN 11 AND 20 THEN 'vermelho'
                    WHEN DATEDIFF(NOW(), created) BETWEEN 21 AND 30 THEN 'vermelho'
                    WHEN DATEDIFF(NOW(), created) > 30 THEN 'vermelho'
                END as cor,
                COUNT(*) as quantidade
            FROM dw_combio.bi_chamados_service_up
            WHERE ${whereClause}
            GROUP BY categoria, cor
            ORDER BY 
                CASE categoria
                    WHEN 'Até 1 dia' THEN 1
                    WHEN 'De 2 a 5 dias' THEN 2
                    WHEN 'De 6 a 10 dias' THEN 3
                    WHEN 'De 11 a 20 dias' THEN 4
                    WHEN 'De 21 a 30 dias' THEN 5
                    WHEN 'Mais de 30 dias' THEN 6
                END
        `;

        const [rows] = await connection.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar tempo de chamado aberto:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Dashboard: Última Atualização (baseado em changed com semáforo)
router.get('/dashboard/ultima-atualizacao', async (req, res) => {
    try {
        const connection = getConnection();
        const { ticket, analistaFilter, analistas } = req.query;

        let whereClause = `state_name != 'Encerrado' AND changed IS NOT NULL`;

        // Filtro por analista
        const analistaFilterSQL = buildAnalistaFilter(analistaFilter, analistas ? JSON.parse(analistas) : []);
        if (analistaFilterSQL) {
            whereClause += ` AND ${analistaFilterSQL}`;
        }

        // Filtro por ticket específico
        if (ticket && ticket !== 'null' && ticket !== '') {
            whereClause += ` AND ticket_id = '${ticket.replace(/'/g, "''")}'`;
        }

        const query = `
            SELECT 
                CASE 
                    WHEN DATEDIFF(NOW(), changed) <= 1 THEN 'Até 1 dia'
                    WHEN DATEDIFF(NOW(), changed) BETWEEN 2 AND 5 THEN 'De 2 a 5 dias'
                    WHEN DATEDIFF(NOW(), changed) BETWEEN 6 AND 10 THEN 'De 6 a 10 dias'
                    WHEN DATEDIFF(NOW(), changed) BETWEEN 11 AND 20 THEN 'De 11 a 20 dias'
                    WHEN DATEDIFF(NOW(), changed) BETWEEN 21 AND 30 THEN 'De 21 a 30 dias'
                    WHEN DATEDIFF(NOW(), changed) > 30 THEN 'Mais de 30 dias'
                END as categoria,
                CASE 
                    WHEN DATEDIFF(NOW(), changed) <= 1 THEN 'verde'
                    WHEN DATEDIFF(NOW(), changed) BETWEEN 2 AND 5 THEN 'amarelo'
                    WHEN DATEDIFF(NOW(), changed) BETWEEN 6 AND 10 THEN 'amarelo'
                    WHEN DATEDIFF(NOW(), changed) BETWEEN 11 AND 20 THEN 'vermelho'
                    WHEN DATEDIFF(NOW(), changed) BETWEEN 21 AND 30 THEN 'vermelho'
                    WHEN DATEDIFF(NOW(), changed) > 30 THEN 'vermelho'
                END as cor,
                COUNT(*) as quantidade
            FROM dw_combio.bi_chamados_service_up
            WHERE ${whereClause}
            GROUP BY categoria, cor
            ORDER BY 
                CASE categoria
                    WHEN 'Até 1 dia' THEN 1
                    WHEN 'De 2 a 5 dias' THEN 2
                    WHEN 'De 6 a 10 dias' THEN 3
                    WHEN 'De 11 a 20 dias' THEN 4
                    WHEN 'De 21 a 30 dias' THEN 5
                    WHEN 'Mais de 30 dias' THEN 6
                END
        `;

        const [rows] = await connection.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar última atualização:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Dashboard: Tabela de Detalhes (com filtros dinâmicos)
router.get('/dashboard/detalhes', async (req, res) => {
    try {
        const connection = getConnection();
        const {
            status,           // filtro por state_name específico
            tempoAberto,     // filtro por categoria de tempo aberto (ex: "Até 1 dia", "De 2 a 5 dias", etc)
            ultimaAtualizacao, // filtro por categoria de última atualização (ex: "Até 1 dia", "De 2 a 5 dias", etc)
            responsavel,      // filtro por owner_name/responsável
            ticket,           // filtro por ticket_id
            analistaFilter,   // filtro por analista (todos/qualiit/analistas)
            analistas         // lista de analistas selecionados
        } = req.query;

        // Construir filtros dinâmicos
        let filtros = ['state_name != \'Encerrado\''];

        // Filtro por status específico
        if (status && status !== 'null' && status !== '') {
            filtros.push(`state_name = '${status.replace(/'/g, "''")}'`);
        }

        // Filtro por responsável
        if (responsavel && responsavel !== 'null' && responsavel !== '') {
            filtros.push(`(owner_name = '${responsavel.replace(/'/g, "''")}' OR responsible_name = '${responsavel.replace(/'/g, "''")}')`);
        }

        // Filtro por ticket
        if (ticket && ticket !== 'null' && ticket !== '') {
            filtros.push(`ticket_id = '${ticket.replace(/'/g, "''")}'`);
        }

        // Filtro por tempo aberto (created)
        if (tempoAberto && tempoAberto !== 'null' && tempoAberto !== '') {
            switch (tempoAberto) {
                case 'Até 1 dia':
                    filtros.push('DATEDIFF(NOW(), created) <= 1');
                    break;
                case 'De 2 a 5 dias':
                    filtros.push('DATEDIFF(NOW(), created) BETWEEN 2 AND 5');
                    break;
                case 'De 6 a 10 dias':
                    filtros.push('DATEDIFF(NOW(), created) BETWEEN 6 AND 10');
                    break;
                case 'De 11 a 20 dias':
                    filtros.push('DATEDIFF(NOW(), created) BETWEEN 11 AND 20');
                    break;
                case 'De 21 a 30 dias':
                    filtros.push('DATEDIFF(NOW(), created) BETWEEN 21 AND 30');
                    break;
                case 'Mais de 30 dias':
                    filtros.push('DATEDIFF(NOW(), created) > 30');
                    break;
            }
        }

        // Filtro por última atualização (changed)
        if (ultimaAtualizacao && ultimaAtualizacao !== 'null' && ultimaAtualizacao !== '') {
            switch (ultimaAtualizacao) {
                case 'Até 1 dia':
                    filtros.push('DATEDIFF(NOW(), changed) <= 1');
                    break;
                case 'De 2 a 5 dias':
                    filtros.push('DATEDIFF(NOW(), changed) BETWEEN 2 AND 5');
                    break;
                case 'De 6 a 10 dias':
                    filtros.push('DATEDIFF(NOW(), changed) BETWEEN 6 AND 10');
                    break;
                case 'De 11 a 20 dias':
                    filtros.push('DATEDIFF(NOW(), changed) BETWEEN 11 AND 20');
                    break;
                case 'De 21 a 30 dias':
                    filtros.push('DATEDIFF(NOW(), changed) BETWEEN 21 AND 30');
                    break;
                case 'Mais de 30 dias':
                    filtros.push('DATEDIFF(NOW(), changed) > 30');
                    break;
            }
        }

        // Filtro por analista
        const analistaFilterSQL = buildAnalistaFilter(analistaFilter, analistas ? JSON.parse(analistas) : []);
        if (analistaFilterSQL) {
            filtros.push(analistaFilterSQL);
        }

        const whereClause = filtros.join(' AND ');

        const query = `
            SELECT 
                ticket_number as ticket,
                ${normalizeAnalistaName('COALESCE(owner_name, responsible_name, \'Sem Proprietário\')')} as responsavel,
                created as data_criacao,
                changed as data_alteracao,
                state_name as status,
                CASE 
                    ${tempoAberto && tempoAberto !== 'null' && tempoAberto !== ''
                ? `WHEN DATEDIFF(NOW(), created) <= 1 THEN 'verde'
                           WHEN DATEDIFF(NOW(), created) BETWEEN 2 AND 5 THEN 'amarelo'
                           WHEN DATEDIFF(NOW(), created) BETWEEN 6 AND 10 THEN 'amarelo'
                           WHEN DATEDIFF(NOW(), created) BETWEEN 11 AND 20 THEN 'vermelho'
                           WHEN DATEDIFF(NOW(), created) BETWEEN 21 AND 30 THEN 'vermelho'
                           WHEN DATEDIFF(NOW(), created) > 30 THEN 'vermelho'`
                : `WHEN DATEDIFF(NOW(), changed) <= 1 THEN 'verde'
                           WHEN DATEDIFF(NOW(), changed) BETWEEN 2 AND 5 THEN 'amarelo'
                           WHEN DATEDIFF(NOW(), changed) BETWEEN 6 AND 10 THEN 'amarelo'
                           WHEN DATEDIFF(NOW(), changed) BETWEEN 11 AND 20 THEN 'vermelho'
                           WHEN DATEDIFF(NOW(), changed) BETWEEN 21 AND 30 THEN 'vermelho'
                           WHEN DATEDIFF(NOW(), changed) > 30 THEN 'vermelho'`
            }
                END as cor_atualizacao,
                1 as atualizacao
            FROM dw_combio.bi_chamados_service_up
            WHERE ${whereClause}
                AND created IS NOT NULL
            ORDER BY changed DESC
        `;

        const [rows] = await connection.query(query);

        // Contar total de registros
        const totalQuery = `
            SELECT COUNT(*) as total
            FROM dw_combio.bi_chamados_service_up
            WHERE ${whereClause}
                AND created IS NOT NULL
        `;
        const [totalRows] = await connection.query(totalQuery);
        const total = totalRows[0]?.total || 0;

        res.json({
            dados: rows,
            total: total
        });
    } catch (error) {
        console.error('Erro ao buscar detalhes dos chamados:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Dashboard: Causa Raiz (filtra por service_name contendo "Cauza Raiz")
router.get('/dashboard/causa-raiz', async (req, res) => {
    try {
        const connection = getConnection();
        const { ticket, analistaFilter, analistas } = req.query;

        // Filtro: service_name contém "Causa Raiz" ou "Cauza Raiz" (sem filtro de status - mostra todos)
        let whereClause = `(LOWER(service_name) LIKE '%causa raiz%' OR LOWER(service_name) LIKE '%causaraiz%' OR LOWER(service_name) LIKE '%cauza raiz%' OR LOWER(service_name) LIKE '%cauzaraiz%') AND service_name IS NOT NULL`;

        // Filtro por analista
        const analistaFilterSQL = buildAnalistaFilter(analistaFilter, analistas ? JSON.parse(analistas) : []);
        if (analistaFilterSQL) {
            whereClause += ` AND ${analistaFilterSQL}`;
        }

        // Filtro por ticket específico
        if (ticket && ticket !== 'null' && ticket !== '') {
            whereClause += ` AND ticket_id = '${ticket.replace(/'/g, "''")}'`;
        }

        const query = `
            SELECT 
                ticket_number as ticket,
                ${normalizeAnalistaName('COALESCE(owner_name, responsible_name, \'Sem Proprietário\')')} as responsavel
            FROM dw_combio.bi_chamados_service_up
            WHERE ${whereClause}
            ORDER BY ticket_number DESC
        `;

        const [rows] = await connection.query(query);

        // Log temporário para debug
        console.log('Query Causa Raiz:', query);
        console.log('Resultados encontrados:', rows.length);

        // Contar total resolvido (causa raiz)
        const total = rows.length;

        res.json({
            dados: rows,
            total: total
        });
    } catch (error) {
        console.error('Erro ao buscar causa raiz:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Dashboard: Em Andamento (filtra por service_name contendo "Cauza Raiz" e status diferente de "Encerrado")
router.get('/dashboard/em-andamento', async (req, res) => {
    try {
        const connection = getConnection();
        const { ticket, analistaFilter, analistas } = req.query;

        // Filtro: service_name contém "Causa Raiz" ou "Cauza Raiz" E status diferente de "Encerrado"
        let whereClause = `(LOWER(service_name) LIKE '%causa raiz%' OR LOWER(service_name) LIKE '%causaraiz%' OR LOWER(service_name) LIKE '%cauza raiz%' OR LOWER(service_name) LIKE '%cauzaraiz%') AND service_name IS NOT NULL AND state_name != 'Encerrado'`;

        // Filtro por analista
        const analistaFilterSQL = buildAnalistaFilter(analistaFilter, analistas ? JSON.parse(analistas) : []);
        if (analistaFilterSQL) {
            whereClause += ` AND ${analistaFilterSQL}`;
        }

        // Filtro por ticket específico
        if (ticket && ticket !== 'null' && ticket !== '') {
            whereClause += ` AND ticket_id = '${ticket.replace(/'/g, "''")}'`;
        }

        // Query para contar total
        const queryTotal = `
            SELECT COUNT(*) as total
            FROM dw_combio.bi_chamados_service_up
            WHERE ${whereClause}
        `;

        // Query para lista detalhada
        const queryDetalhes = `
            SELECT 
                ticket_number as ticket,
                ${normalizeAnalistaName('COALESCE(owner_name, responsible_name, \'Sem Proprietário\')')} as nome,
                state_name as status
            FROM dw_combio.bi_chamados_service_up
            WHERE ${whereClause}
            ORDER BY ticket_number DESC
        `;

        const [totalRows] = await connection.query(queryTotal);
        const [detalhesRows] = await connection.query(queryDetalhes);

        // Log temporário para debug
        console.log('Query Em Andamento:', queryDetalhes);
        console.log('Resultados encontrados:', detalhesRows.length);

        const total = totalRows[0]?.total || 0;

        res.json({
            total: total,
            dados: detalhesRows
        });
    } catch (error) {
        console.error('Erro ao buscar chamados em andamento:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Classificação por domínio
router.get('/dominio', async (req, res) => {
    try {
        const connection = getConnection();
        const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;

        const dateFilter = buildDateFilter(month, year, startDate, endDate, 'created');
        const analistaFilterSQL = buildAnalistaFilter(analistaFilter, analistas ? JSON.parse(analistas) : []);

        const query = `
            SELECT 
                TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(service_name, '::', 2), '::', -1)) as nome,
                COUNT(*) as valor
            FROM dw_combio.bi_chamados_service_up
            WHERE ${dateFilter}
                ${analistaFilterSQL ? `AND ${analistaFilterSQL}` : ''}
                AND service_name IS NOT NULL
                AND service_name LIKE '%::%'
            GROUP BY nome
            ORDER BY valor DESC
        `;

        const [rows] = await connection.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar classificação por domínio:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Datasul (maior ofensor)
router.get('/datasul', async (req, res) => {
    try {
        const connection = getConnection();
        const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;

        const dateFilter = buildDateFilter(month, year, startDate, endDate, 'created');
        const analistaFilterSQL = buildAnalistaFilter(analistaFilter, analistas ? JSON.parse(analistas) : []);

        const query = `
            SELECT 
                TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(service_name, '::', 3), '::', -1)) as nome,
                COUNT(*) as valor
            FROM dw_combio.bi_chamados_service_up
            WHERE service_name LIKE '%Datasul%'
                AND ${dateFilter}
                ${analistaFilterSQL ? `AND ${analistaFilterSQL}` : ''}
                AND service_name IS NOT NULL
                AND service_name LIKE '%::%::%'
            GROUP BY nome
            ORDER BY valor DESC
            LIMIT 10
        `;

        const [rows] = await connection.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar chamados Datasul:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Fluig (maior ofensor)
router.get('/fluig', async (req, res) => {
    try {
        const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;

        // Verificar se é novembro de 2025 e retornar dados mockados
        const monthNum = month ? parseInt(month) : null;
        const yearNum = year ? parseInt(year) : null;
        const isNovembro2025 = monthNum === 11 && yearNum === 2025;

        // Se for novembro de 2025, retornar dados mockados
        if (isNovembro2025) {
            const mockDataNovembro = [
                { nome: 'Biomassa', valor: 32 },
                { nome: 'Recebimento de notas', valor: 25 },
                { nome: 'Solicitacao de compra delegada', valor: 13 },
                { nome: 'Recebimento fácil', valor: 6 },
                { nome: 'Solicitação de pagamento', valor: 5 }
            ];
            return res.json(mockDataNovembro);
        }

        const connection = getConnection();
        const dateFilter = buildDateFilter(month, year, startDate, endDate, 'created');
        const analistaFilterSQL = buildAnalistaFilter(analistaFilter, analistas ? JSON.parse(analistas) : []);

        const query = `
            SELECT 
                CASE
                    WHEN LOWER(title) LIKE '%integração%' OR LOWER(title) LIKE '%integra%' THEN 'Erro Integração NF'
                    WHEN LOWER(title) LIKE '%ordem%' OR LOWER(title) LIKE '%manutenção%' OR LOWER(title) LIKE '%manutencao%' THEN 'Recebimento Facil'
                    WHEN LOWER(title) LIKE '%conta%' OR LOWER(title) LIKE '%contabil%' OR LOWER(title) LIKE '% sc %' OR LOWER(title) LIKE 'sc %' OR LOWER(title) LIKE '% sc' OR LOWER(title) LIKE '%sc' THEN 'Solicitações de Compra'
                    WHEN LOWER(title) LIKE '%bio%' OR LOWER(title) LIKE '%biomassa%' THEN 'Biomassa'
                    WHEN LOWER(title) LIKE '%receb%' OR LOWER(title) LIKE '%notas%' THEN 'Recebimento de notas'
                    WHEN LOWER(title) LIKE '%compra%' OR LOWER(title) LIKE '%solic%' OR LOWER(title) LIKE '%deleg%' OR LOWER(title) LIKE '% sc %' OR LOWER(title) LIKE 'sc %' OR LOWER(title) LIKE '% sc' OR LOWER(title) LIKE '%sc' THEN 'Solicitações de Compra'
                    WHEN LOWER(title) LIKE '%fácil%' OR LOWER(title) LIKE '%facil%' THEN 'Recebimento fácil'
                    WHEN LOWER(title) LIKE '%pag%' OR LOWER(title) LIKE '%pagamento%' THEN 'Solicitação de pagamento'
                    ELSE 'Processo Integração Fluig'
                END as nome,
                COUNT(*) as valor
            FROM dw_combio.bi_chamados_service_up
            WHERE service_name LIKE '%Fluig%'
                AND ${dateFilter}
                ${analistaFilterSQL ? `AND ${analistaFilterSQL}` : ''}
                AND title IS NOT NULL
                AND title != ''
            GROUP BY nome
            ORDER BY valor DESC
        `;

        const [rows] = await connection.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar chamados Fluig:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Analistas
router.get('/analistas', async (req, res) => {
    try {
        const connection = getConnection();
        const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;

        const dateFilter = buildDateFilter(month, year, startDate, endDate, 'created');
        const analistaFilterSQL = buildAnalistaFilter(analistaFilter, analistas ? JSON.parse(analistas) : []);

        const query = `
            SELECT 
                ${normalizeAnalistaName('COALESCE(owner_name, responsible_name, \'Sem Analista\')')} as nome,
                COUNT(*) as valor
            FROM dw_combio.bi_chamados_service_up
            WHERE ${dateFilter}
                ${analistaFilterSQL ? `AND ${analistaFilterSQL}` : ''}
                AND (owner_name IS NOT NULL OR responsible_name IS NOT NULL)
            GROUP BY nome
            ORDER BY valor DESC
        `;

        const [rows] = await connection.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar analistas:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - SLA
router.get('/sla', async (req, res) => {
    try {
        // DADOS MOCKADOS - TEMPORÁRIO ATÉ SEGUNDA ORDEM
        // Query original comentada abaixo
        /*
        const connection = getConnection();
        const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;

        const dateFilter = buildDateFilter(month, year, startDate, endDate, 'closed');
        const analistaFilterSQL = buildAnalistaFilter(analistaFilter, analistas ? JSON.parse(analistas) : []);

        const query = `
            SELECT 
                DATE_FORMAT(closed, '%Y-%m') as mes,
                COUNT(*) as total,
                -- Calcular dentro do SLA
                SUM(CASE 
                    WHEN solution_in_min IS NOT NULL 
                    AND solution_in_min != '' 
                    AND solution_in_min != '0'
                    AND (
                        -- Priority 1 ou 2: 72 horas
                        ((priority_id = 1 OR priority_id = 2) AND CAST(solution_in_min AS UNSIGNED) <= 4320)
                        OR
                        -- Priority 3: 24 horas
                        (priority_id = 3 AND CAST(solution_in_min AS UNSIGNED) <= 1440)
                        OR
                        -- Priority 4 ou 5: 6 horas
                        ((priority_id = 4 OR priority_id = 5) AND CAST(solution_in_min AS UNSIGNED) <= 360)
                    )
                    THEN 1 
                    ELSE 0 
                END) as dentroSLA_count,
                -- Calcular fora do SLA
                SUM(CASE 
                    WHEN solution_in_min IS NOT NULL 
                    AND solution_in_min != '' 
                    AND solution_in_min != '0'
                    AND (
                        -- Priority 1 ou 2: > 72 horas
                        ((priority_id = 1 OR priority_id = 2) AND CAST(solution_in_min AS UNSIGNED) > 4320)
                        OR
                        -- Priority 3: > 24 horas
                        (priority_id = 3 AND CAST(solution_in_min AS UNSIGNED) > 1440)
                        OR
                        -- Priority 4 ou 5: > 6 horas
                        ((priority_id = 4 OR priority_id = 5) AND CAST(solution_in_min AS UNSIGNED) > 360)
                    )
                    THEN 1 
                    ELSE 0 
                END) as foraSLA_count
            FROM dw_combio.bi_chamados_service_up
            WHERE ${dateFilter}
                ${analistaFilterSQL ? `AND ${analistaFilterSQL}` : ''}
                AND closed IS NOT NULL
                AND state_type = 'closed'
                AND priority_id IS NOT NULL
            GROUP BY DATE_FORMAT(closed, '%Y-%m')
            HAVING total > 0
            ORDER BY DATE_FORMAT(closed, '%Y-%m') ASC
        `;

        const [rows] = await connection.query(query);

        // Calcular percentuais
        const result = rows.map(row => {
            const total = Number(row.total) || 0;
            const dentroCount = Number(row.dentroSLA_count) || 0;
            const foraCount = Number(row.foraSLA_count) || 0;

            return {
                mes: row.mes,
                dentroSLA: total > 0 ? Number((dentroCount / total * 100).toFixed(2)) : 0,
                foraSLA: total > 0 ? Number((foraCount / total * 100).toFixed(2)) : 0
            };
        });

        res.json(result);
        */

        // Dados mockados fixos para SLA anual 2025 (baseado no gráfico)
        const mockData = [
            { mes: '2025-01', dentroSLA: 97.79, foraSLA: 2.21 },
            { mes: '2025-02', dentroSLA: 96.17, foraSLA: 3.83 },
            { mes: '2025-03', dentroSLA: 95.26, foraSLA: 4.74 },
            { mes: '2025-04', dentroSLA: 95.49, foraSLA: 4.51 },
            { mes: '2025-05', dentroSLA: 94.29, foraSLA: 5.71 },
            { mes: '2025-06', dentroSLA: 96.39, foraSLA: 3.61 },
            { mes: '2025-07', dentroSLA: 97.57, foraSLA: 2.43 },
            { mes: '2025-08', dentroSLA: 92.22, foraSLA: 7.78 },
            { mes: '2025-09', dentroSLA: 94.18, foraSLA: 5.81 },
            { mes: '2025-10', dentroSLA: 91.75, foraSLA: 8.24 },
            { mes: '2025-11', dentroSLA: 91.23, foraSLA: 8.77 },
            { mes: '2025-12', dentroSLA: 88.46, foraSLA: 11.54 }
        ];

        res.json(mockData);
    } catch (error) {
        console.error('Erro ao buscar SLA:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - SLA por Analista
router.get('/sla-analista', async (req, res) => {
    try {
        const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;

        // Verificar se é novembro ou dezembro de 2025 e retornar dados mockados
        const monthNum = month ? parseInt(month) : null;
        const yearNum = year ? parseInt(year) : null;
        const isNovembro2025 = monthNum === 11 && yearNum === 2025;
        const isDezembro2025 = monthNum === 12 && yearNum === 2025;

        // Se for novembro de 2025, retornar dados mockados
        if (isNovembro2025) {
            const mockDataNovembro = [
                { analista: 'Adriano Santos', dentroSLA: 155, foraSLA: 4 },
                { analista: 'Lucas Algarve', dentroSLA: 119, foraSLA: 1 },
                { analista: 'Lucas Mendes', dentroSLA: 67, foraSLA: 22 },
                { analista: 'Luiz Fernando', dentroSLA: 85, foraSLA: 14 }
            ];
            return res.json(mockDataNovembro);
        }

        // Se for dezembro de 2025, retornar dados mockados atualizados
        if (isDezembro2025) {
            const mockDataDezembro = [
                { analista: 'Adriano Santos', dentroSLA: 156, foraSLA: 4 },
                { analista: 'Lucas Algarve', dentroSLA: 92, foraSLA: 1 },
                { analista: 'Lucas Mendes', dentroSLA: 81, foraSLA: 29 },
                { analista: 'Luiz Fernando', dentroSLA: 54, foraSLA: 16 }
            ];
            return res.json(mockDataDezembro);
        }

        // Lista fixa dos 4 analistas permitidos (com variações)
        const analistasPermitidos = [
            'Adriano Santos',
            'Lucas Algarve da Silva',
            'Lucas Algarve',
            'Lucas Mendes',
            'Qualiit - Luiz Fernando',
            'Luiz Fernando'
        ];
        const listaAnalistas = analistasPermitidos.map(a => `'${a.replace(/'/g, "''")}'`).join(', ');

        // Nomes normalizados esperados após remover prefixos
        const nomesNormalizados = [
            'Adriano Santos',
            'Lucas Algarve da Silva',
            'Lucas Mendes',
            'Luiz Fernando'
        ];
        const listaNormalizados = nomesNormalizados.map(a => `'${a.replace(/'/g, "''")}'`).join(', ');

        const connection = getConnection();

        const dateFilter = buildDateFilter(month, year, startDate, endDate, 'closed');
        const analistaFilterSQL = buildAnalistaFilter(analistaFilter, analistas ? JSON.parse(analistas) : []);

        // Query que normaliza nomes e agrupa analistas com e sem "Qualiit - ", "Qualiit - " ou "Quallit - "
        const query = `
            SELECT 
                TRIM(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                COALESCE(owner_name, responsible_name, 'Sem Analista'),
                                'Qualiit - ',
                                ''
                            ),
                            'Qualiit - ',
                            ''
                        ),
                        'Quallit - ',
                        ''
                    )
                ) as analista,
                SUM(CASE 
                    WHEN solution_in_min IS NOT NULL 
                    AND solution_in_min != '' 
                    AND solution_in_min != '0'
                    AND (
                        -- Priority 1 ou 2: 72 horas
                        ((priority_id = 1 OR priority_id = 2) AND CAST(solution_in_min AS UNSIGNED) <= 4320)
                        OR
                        -- Priority 3: 24 horas
                        (priority_id = 3 AND CAST(solution_in_min AS UNSIGNED) <= 1440)
                        OR
                        -- Priority 4 ou 5: 6 horas
                        ((priority_id = 4 OR priority_id = 5) AND CAST(solution_in_min AS UNSIGNED) <= 360)
                    )
                    THEN 1 
                    ELSE 0 
                END) as dentroSLA,
                SUM(CASE 
                    WHEN solution_in_min IS NOT NULL 
                    AND solution_in_min != '' 
                    AND solution_in_min != '0'
                    AND (
                        -- Priority 1 ou 2: > 72 horas
                        ((priority_id = 1 OR priority_id = 2) AND CAST(solution_in_min AS UNSIGNED) > 4320)
                        OR
                        -- Priority 3: > 24 horas
                        (priority_id = 3 AND CAST(solution_in_min AS UNSIGNED) > 1440)
                        OR
                        -- Priority 4 ou 5: > 6 horas
                        ((priority_id = 4 OR priority_id = 5) AND CAST(solution_in_min AS UNSIGNED) > 360)
                    )
                    THEN 1 
                    ELSE 0 
                END) as foraSLA
            FROM dw_combio.bi_chamados_service_up
            WHERE ${dateFilter}
                ${analistaFilterSQL ? `AND ${analistaFilterSQL}` : ''}
                AND closed IS NOT NULL
                AND (owner_name IS NOT NULL OR responsible_name IS NOT NULL)
                AND state_type = 'closed'
                AND priority_id IS NOT NULL
                AND (
                    TRIM(REPLACE(REPLACE(REPLACE(owner_name, 'Qualiit - ', ''), 'Qualiit - ', ''), 'Quallit - ', '')) IN (${listaNormalizados})
                    OR TRIM(REPLACE(REPLACE(REPLACE(responsible_name, 'Qualiit - ', ''), 'Qualiit - ', ''), 'Quallit - ', '')) IN (${listaNormalizados})
                )
            GROUP BY analista
            HAVING (dentroSLA + foraSLA) > 0
                AND analista IN (${listaNormalizados})
            ORDER BY dentroSLA DESC
        `;

        const [rows] = await connection.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar SLA por analista:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Satisfação
router.get('/satisfacao', async (req, res) => {
    try {
        const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;

        // Verificar se é novembro de 2025 e retornar dados mockados
        const monthNum = month ? parseInt(month) : null;
        const yearNum = year ? parseInt(year) : null;
        const isNovembro2025 = monthNum === 11 && yearNum === 2025;

        // Se for novembro de 2025, retornar dados mockados
        if (isNovembro2025) {
            const mockDataNovembro = [
                { analista: 'Adriano Santos', excelente: 22, bom: 2, regular: 0, ruim: 0 },
                { analista: 'Lucas Algarve', excelente: 15, bom: 0, regular: 1, ruim: 1 },
                { analista: 'Lucas Mendes', excelente: 1, bom: 0, regular: 0, ruim: 0 },
                { analista: 'Luiz Fernando', excelente: 8, bom: 0, regular: 1, ruim: 0 }
            ];
            return res.json(mockDataNovembro);
        }

        const connection = getConnection();
        const dateFilter = buildDateFilter(month, year, startDate, endDate, 'Data_Fechamento');
        const analistaFilterSQL = buildAnalistaFilterSatisfacao(analistaFilter, analistas ? JSON.parse(analistas) : []);

        const query = `
            SELECT 
                ${normalizeAnalistaName('Owner')} as analista,
                -- Excelente (apenas valores exatos)
                SUM(CASE 
                    WHEN Satisfacao = '15 - Excelente' THEN 1 
                    ELSE 0 
                END) as excelente,
                -- Bom (apenas valores exatos)
                SUM(CASE 
                    WHEN Satisfacao = '9 - Bom' OR Satisfacao = '16 - Bom' THEN 1 
                    ELSE 0 
                END) as bom,
                -- Regular (apenas valores exatos)
                SUM(CASE 
                    WHEN Satisfacao = '17 - Regular' THEN 1 
                    ELSE 0 
                END) as regular,
                -- Ruim (apenas valores exatos)
                SUM(CASE 
                    WHEN Satisfacao = '11 - Ruim' OR Satisfacao = '18 - Ruim' THEN 1 
                    ELSE 0 
                END) as ruim
            FROM dw_combio.bi_chamados_satisfacao_service_up
            WHERE ${dateFilter}
                ${analistaFilterSQL ? `AND ${analistaFilterSQL}` : ''}
                AND Satisfacao IS NOT NULL
                AND Satisfacao != ''
                AND Owner IS NOT NULL
                AND (
                    Satisfacao = '15 - Excelente'
                    OR Satisfacao = '9 - Bom'
                    OR Satisfacao = '16 - Bom'
                    OR Satisfacao = '17 - Regular'
                    OR Satisfacao = '11 - Ruim'
                    OR Satisfacao = '18 - Ruim'
                )
            GROUP BY analista
            HAVING (excelente + bom + regular + ruim) > 0
            ORDER BY excelente DESC
        `;

        const [rows] = await connection.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar satisfação:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Classificação de Satisfação (tabela)
router.get('/satisfacao-classificacao', async (req, res) => {
    try {
        const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;

        // Verificar se é novembro de 2025 e retornar dados mockados
        const monthNum = month ? parseInt(month) : null;
        const yearNum = year ? parseInt(year) : null;
        const isNovembro2025 = monthNum === 11 && yearNum === 2025;

        // Se for novembro de 2025, retornar dados mockados
        if (isNovembro2025) {
            const mockDataNovembro = [
                { classificacao: 'Excelente', total: 46 },
                { classificacao: 'Bom', total: 2 },
                { classificacao: 'Regular', total: 2 },
                { classificacao: 'Ruim', total: 1 }
            ];
            return res.json(mockDataNovembro);
        }

        const connection = getConnection();
        const dateFilter = buildDateFilter(month, year, startDate, endDate, 'Data_Fechamento');
        const analistaFilterSQL = buildAnalistaFilterSatisfacao(analistaFilter, analistas ? JSON.parse(analistas) : []);

        const query = `
            SELECT 
                CASE 
                    -- Excelente (APENAS valores que contêm exatamente "Excelente")
                    WHEN Satisfacao = '15 - Excelente' THEN 'Excelente'
                    
                    -- Bom (APENAS valores que contêm exatamente "Bom")
                    WHEN Satisfacao = '16 - Bom' THEN 'Bom'
                    WHEN Satisfacao = '9 - Bom' THEN 'Bom'
                    
                    -- Regular (APENAS valores que contêm exatamente "Regular")
                    WHEN Satisfacao = '17 - Regular' THEN 'Regular'
                    
                    -- Ruim (APENAS valores que contêm exatamente "Ruim")
                    WHEN Satisfacao = '18 - Ruim' THEN 'Ruim'
                    WHEN Satisfacao = '11 - Ruim' THEN 'Ruim'
                    
                    ELSE NULL
                END as classificacao,
                COUNT(*) as total
            FROM dw_combio.bi_chamados_satisfacao_service_up
            WHERE ${dateFilter}
                ${analistaFilterSQL ? `AND ${analistaFilterSQL}` : ''}
                AND Satisfacao IS NOT NULL
                AND Satisfacao != ''
                AND Owner IS NOT NULL
                AND (
                    Satisfacao = '15 - Excelente'
                    OR Satisfacao = '16 - Bom'
                    OR Satisfacao = '9 - Bom'
                    OR Satisfacao = '17 - Regular'
                    OR Satisfacao = '18 - Ruim'
                    OR Satisfacao = '11 - Ruim'
                )
            GROUP BY 
                CASE 
                    WHEN Satisfacao = '15 - Excelente' THEN 'Excelente'
                    WHEN Satisfacao = '16 - Bom' THEN 'Bom'
                    WHEN Satisfacao = '9 - Bom' THEN 'Bom'
                    WHEN Satisfacao = '17 - Regular' THEN 'Regular'
                    WHEN Satisfacao = '18 - Ruim' THEN 'Ruim'
                    WHEN Satisfacao = '11 - Ruim' THEN 'Ruim'
                    ELSE NULL
                END
            ORDER BY 
                CASE classificacao
                    WHEN 'Excelente' THEN 1
                    WHEN 'Bom' THEN 2
                    WHEN 'Regular' THEN 3
                    WHEN 'Ruim' THEN 4
                    ELSE 5
                END
        `;

        const [rows] = await connection.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar classificação de satisfação:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Top 20 Usuários (customer_user) que mais abriram chamados
router.get('/top-20-usuarios', async (req, res) => {
    try {
        const connection = getConnection();
        const { month, year, startDate, endDate } = req.query;

        const dateFilter = buildDateFilter(month, year, startDate, endDate, 'created');

        const query = `
            SELECT 
                customer_user as usuario,
                COUNT(*) as quantidade
            FROM dw_combio.bi_chamados_service_up
            WHERE ${dateFilter}
                AND created IS NOT NULL
                AND customer_user IS NOT NULL
                AND customer_user != ''
            GROUP BY customer_user
            ORDER BY quantidade DESC
            LIMIT 20
        `;

        const [rows] = await connection.query(query);

        // Função para formatar nome: "nome.sobrenome" -> "Nome Sobrenome"
        const formatarNome = (nome) => {
            if (!nome) return nome;
            return nome
                .toLowerCase()
                .replace(/\./g, ' ')
                .split(' ')
                .map(p => p.charAt(0).toUpperCase() + p.slice(1))
                .join(' ')
                .trim();
        };

        const resultado = rows.map(row => ({
            usuario: formatarNome(row.usuario),
            quantidade: row.quantidade
        }));

        res.json(resultado);
    } catch (error) {
        console.error('Erro ao buscar top 20 usuários:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Lista todos os analistas únicos do banco
router.get('/lista-analistas', async (req, res) => {
    try {
        const connection = getConnection();

        const query = `
            SELECT DISTINCT 
                ${normalizeAnalistaName('COALESCE(owner_name, responsible_name)')} as analista
            FROM dw_combio.bi_chamados_service_up
            WHERE (owner_name IS NOT NULL OR responsible_name IS NOT NULL)
                AND COALESCE(owner_name, responsible_name) != ''
            ORDER BY analista ASC
        `;

        const [rows] = await connection.query(query);
        const analistas = rows
            .map(row => row.analista)
            .filter(analista => analista && analista.trim() !== '')
            .sort();

        res.json(analistas);
    } catch (error) {
        console.error('Erro ao buscar lista de analistas:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
