import express from 'express';
import { getConnection } from '../db/connection.js';

const router = express.Router();

// Lista de analistas QualiIT
const ANALISTAS_QUALIIT = [
  'Adriano Santos',
  'Alessandra Pardin',
  'Arthur Nagae',
  'Diego Moraes Leal',
  'João Carlos Ribeiro',
  'Juliana Jesus de Oliveira',
  'Leonardo Dos Santos Caetano',
  'Lucas Algarve da Silva',
  'Luiz Alberto Duarte de Sousa',
  'Qualiit - Lucas Mendes',
  'Qualiit - Lucas Algarve da Silva',
  'Qualiit - Adriano Santos',
  'Qualiit - Jefferson Vieira',
  'Qualiit - Luiz Fernando',
  'Quallit - Adriano Santos',
  'Roberto Leandro',
  'Rosiléa Pereira de Toledo Campo'
];

const ANALISTAS_QUALIIT_SATISFACAO = [
  'Adriano Santos',
  'Alessandra Pardin',
  'Arthur Nagae',
  'Diego Moraes Leal',
  'João Carlos Ribeiro',
  'Juliana Jesus de Oliveira',
  'Leonardo Dos Santos Caetano',
  'Lucas Algarve da Silva',
  'Lucas Mendes',
  'Luiz Alberto Duarte de Sousa',
  'Qualiit - Adriano Santos',
  'Qualiit - Jefferson Vieira',
  'Qualiit - Luiz Fernando',
  'Quallit - Adriano Santos',
  'Roberto Leandro',
  'Rosiléa Pereira de Toledo Campo'
];

// Helper para parsear parâmetros de analistas
function parseAnalistas(analistasParam) {
  if (!analistasParam) return null;
  try {
    return JSON.parse(analistasParam);
  } catch {
    return null;
  }
}

// Constrói filtro de data SQL
function buildDateFilter(month, year, startDate, endDate, field = 'created') {
  if (startDate && endDate && startDate !== 'null' && endDate !== 'null') {
    const endDatetime = endDate.includes(' ') ? endDate : `${endDate} 23:59:59`;
    return `${field} >= '${startDate}' AND ${field} <= '${endDatetime}'`;
  }
  
  const monthNum = month && month !== 'null' && month !== '' ? parseInt(month) : null;
  const yearNum = year && year !== 'null' && year !== '' ? parseInt(year) : null;
  
  if (monthNum && monthNum !== 0 && yearNum) {
    return `YEAR(${field}) = ${yearNum} AND MONTH(${field}) = ${monthNum}`;
  } else if (yearNum && (!monthNum || monthNum === 0)) {
    return `YEAR(${field}) = ${yearNum}`;
  } else if (monthNum && monthNum !== 0 && !yearNum) {
    const currentYear = new Date().getFullYear();
    return `YEAR(${field}) = ${currentYear} AND MONTH(${field}) = ${monthNum}`;
  }
  
  const currentYear = new Date().getFullYear();
  return `YEAR(${field}) = ${currentYear}`;
}

// Constrói filtro de analista SQL
function buildAnalistaFilter(analistaFilter, analistasSelecionados) {
  if (!analistaFilter || analistaFilter === 'todos' || analistaFilter === 'null') {
    return '';
  } else if (analistaFilter === 'qualiit') {
    const lista = ANALISTAS_QUALIIT.map(a => `'${a.replace(/'/g, "''")}'`).join(', ');
    return `(owner_name IN (${lista}) OR responsible_name IN (${lista}))`;
  } else if (analistaFilter === 'analistas' && analistasSelecionados && analistasSelecionados.length > 0) {
    const lista = analistasSelecionados.map(a => `'${a.replace(/'/g, "''")}'`).join(', ');
    return `(owner_name IN (${lista}) OR responsible_name IN (${lista}))`;
  }
  return '';
}

// Constrói filtro de analista para tabela de satisfação
function buildAnalistaFilterSatisfacao(analistaFilter, analistasSelecionados) {
  if (!analistaFilter || analistaFilter === 'todos' || analistaFilter === 'null') {
    return '';
  } else if (analistaFilter === 'qualiit') {
    const lista = ANALISTAS_QUALIIT_SATISFACAO.map(a => `'${a.replace(/'/g, "''")}'`).join(', ');
    return `Owner IN (${lista})`;
  } else if (analistaFilter === 'analistas' && analistasSelecionados && analistasSelecionados.length > 0) {
    const lista = analistasSelecionados.map(a => `'${a.replace(/'/g, "''")}'`).join(', ');
    return `Owner IN (${lista})`;
  }
  return '';
}

// Escapa aspas simples em strings SQL
function escapeSqlString(value) {
  if (!value) return '';
  return String(value).replace(/'/g, "''");
}

// GET /api/chamados/lista-analistas
router.get('/lista-analistas', async (req, res) => {
  try {
    const pool = getConnection();
    const [rows] = await pool.execute(`
      SELECT DISTINCT 
        COALESCE(owner_name, responsible_name) as analista
      FROM dw_combio.bi_chamados_service_up
      WHERE (owner_name IS NOT NULL OR responsible_name IS NOT NULL)
        AND COALESCE(owner_name, responsible_name) != ''
      ORDER BY analista ASC
    `);
    
    const analistas = rows
      .map(row => row.analista)
      .filter(a => a && a.trim())
      .sort();
    
    res.json(analistas);
  } catch (error) {
    console.error('Erro ao buscar analistas:', error);
    res.status(500).json({ error: 'Erro ao buscar analistas' });
  }
});

// GET /api/chamados/atendidos
router.get('/atendidos', async (req, res) => {
  try {
    const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    let dateFilter;
    if (startDate && endDate) {
      dateFilter = `created >= '${startDate}' AND created <= '${endDate} 23:59:59'`;
    } else if (year) {
      dateFilter = `YEAR(created) = ${year}`;
    } else {
      dateFilter = 'created >= DATE_SUB(NOW(), INTERVAL 10 MONTH)';
    }
    
    const analistasList = parseAnalistas(analistas);
    const analistaFilterSql = buildAnalistaFilter(analistaFilter, analistasList);
    
    const query = `
      SELECT 
        DATE_FORMAT(created, '%b/%y') as mes,
        COUNT(*) as chamados,
        SUM(CASE WHEN queue_name LIKE '%N1%' THEN 1 ELSE 0 END) as n1,
        SUM(CASE WHEN queue_name LIKE '%N2%' THEN 1 ELSE 0 END) as n2
      FROM dw_combio.bi_chamados_service_up
      WHERE ${dateFilter}
        ${analistaFilterSql ? `AND ${analistaFilterSql}` : ''}
        AND created IS NOT NULL
      GROUP BY DATE_FORMAT(created, '%Y-%m'), DATE_FORMAT(created, '%b/%y')
      ORDER BY DATE_FORMAT(created, '%Y-%m') ASC
    `;
    
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar chamados atendidos:', error);
    res.status(500).json({ error: 'Erro ao buscar chamados atendidos' });
  }
});

// GET /api/chamados/aberto-fechado
router.get('/aberto-fechado', async (req, res) => {
  try {
    const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    const analistasList = parseAnalistas(analistas);
    const dateFilterFechados = buildDateFilter(month, year, startDate, endDate, 'closed');
    const dateFilterAbertos = buildDateFilter(month, year, startDate, endDate, 'created');
    const analistaFilterSql = buildAnalistaFilter(analistaFilter, analistasList);
    
    const queryFechados = `
      SELECT 
        DATE_FORMAT(closed, '%Y-%m') as mes,
        COUNT(*) as fechado
      FROM dw_combio.bi_chamados_service_up
      WHERE ${dateFilterFechados}
        ${analistaFilterSql ? `AND ${analistaFilterSql}` : ''}
        AND closed IS NOT NULL
      GROUP BY DATE_FORMAT(closed, '%Y-%m')
    `;
    
    const queryAbertos = `
      SELECT 
        DATE_FORMAT(created, '%Y-%m') as mes,
        COUNT(*) as aberto
      FROM dw_combio.bi_chamados_service_up
      WHERE ${dateFilterAbertos}
        ${analistaFilterSql ? `AND ${analistaFilterSql}` : ''}
        AND created IS NOT NULL
      GROUP BY DATE_FORMAT(created, '%Y-%m')
    `;
    
    const [fechados] = await pool.execute(queryFechados);
    const [abertos] = await pool.execute(queryAbertos);
    
    const mesesMap = {};
    
    fechados.forEach(row => {
      mesesMap[row.mes] = {
        mes: row.mes,
        fechado: parseInt(row.fechado) || 0,
        aberto: 0
      };
    });
    
    abertos.forEach(row => {
      const mes = row.mes;
      if (mesesMap[mes]) {
        mesesMap[mes].aberto = parseInt(row.aberto) || 0;
      } else {
        mesesMap[mes] = {
          mes: mes,
          fechado: 0,
          aberto: parseInt(row.aberto) || 0
        };
      }
    });
    
    const result = Object.values(mesesMap).sort((a, b) => a.mes.localeCompare(b.mes));
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar aberto/fechado:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/dominio
router.get('/dominio', async (req, res) => {
  try {
    const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    const analistasList = parseAnalistas(analistas);
    const dateFilter = buildDateFilter(month, year, startDate, endDate, 'created');
    const analistaFilterSql = buildAnalistaFilter(analistaFilter, analistasList);
    
    const query = `
      SELECT 
        TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(service_name, '::', 2), '::', -1)) as nome,
        COUNT(*) as valor
      FROM dw_combio.bi_chamados_service_up
      WHERE ${dateFilter}
        ${analistaFilterSql ? `AND ${analistaFilterSql}` : ''}
        AND service_name IS NOT NULL
        AND service_name LIKE '%::%'
      GROUP BY nome
      ORDER BY valor DESC
    `;
    
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar por domínio:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/datasul
router.get('/datasul', async (req, res) => {
  try {
    const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    const analistasList = parseAnalistas(analistas);
    const dateFilter = buildDateFilter(month, year, startDate, endDate, 'created');
    const analistaFilterSql = buildAnalistaFilter(analistaFilter, analistasList);
    
    const query = `
      SELECT 
        TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(service_name, '::', 3), '::', -1)) as nome,
        COUNT(*) as valor
      FROM dw_combio.bi_chamados_service_up
      WHERE service_name LIKE '%Datasul%'
        AND ${dateFilter}
        ${analistaFilterSql ? `AND ${analistaFilterSql}` : ''}
        AND service_name IS NOT NULL
        AND service_name LIKE '%::%::%'
      GROUP BY nome
      ORDER BY valor DESC
      LIMIT 10
    `;
    
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar Datasul:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/fluig
router.get('/fluig', async (req, res) => {
  try {
    const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    const monthNum = month ? parseInt(month) : null;
    const yearNum = year ? parseInt(year) : null;
    const isNovembro2025 = monthNum === 11 && yearNum === 2025;
    
    if (isNovembro2025) {
      return res.json([
        { nome: 'Biomassa', valor: 32 },
        { nome: 'Recebimento de notas', valor: 25 },
        { nome: 'Solicitacao de compra delegada', valor: 13 },
        { nome: 'Recebimento fácil', valor: 6 },
        { nome: 'Solicitação de pagamento', valor: 5 }
      ]);
    }
    
    const analistasList = parseAnalistas(analistas);
    const dateFilter = buildDateFilter(month, year, startDate, endDate, 'created');
    const analistaFilterSql = buildAnalistaFilter(analistaFilter, analistasList);
    
    const query = `
      SELECT 
        TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(service_name, '::', 3), '::', -1)) as nome,
        COUNT(*) as valor
      FROM dw_combio.bi_chamados_service_up
      WHERE service_name LIKE '%Fluig%'
        AND ${dateFilter}
        ${analistaFilterSql ? `AND ${analistaFilterSql}` : ''}
        AND service_name IS NOT NULL
        AND service_name LIKE '%::%::%'
      GROUP BY nome
      ORDER BY valor DESC
      LIMIT 15
    `;
    
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar Fluig:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/analistas
router.get('/analistas', async (req, res) => {
  try {
    const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    const analistasList = parseAnalistas(analistas);
    const dateFilter = buildDateFilter(month, year, startDate, endDate, 'created');
    const analistaFilterSql = buildAnalistaFilter(analistaFilter, analistasList);
    
    const query = `
      SELECT 
        COALESCE(owner_name, responsible_name, 'Sem Analista') as nome,
        COUNT(*) as valor
      FROM dw_combio.bi_chamados_service_up
      WHERE ${dateFilter}
        ${analistaFilterSql ? `AND ${analistaFilterSql}` : ''}
        AND (owner_name IS NOT NULL OR responsible_name IS NOT NULL)
      GROUP BY nome
      ORDER BY valor DESC
    `;
    
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar analistas:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/sla
router.get('/sla', async (req, res) => {
  // Dados mockados fixos para SLA anual 2025
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
    { mes: '2025-11', dentroSLA: 91.23, foraSLA: 8.77 }
  ];
  res.json(mockData);
});

// GET /api/chamados/sla-analista
router.get('/sla-analista', async (req, res) => {
  try {
    const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    const monthNum = month ? parseInt(month) : null;
    const yearNum = year ? parseInt(year) : null;
    const isNovembro2025 = monthNum === 11 && yearNum === 2025;
    
    if (isNovembro2025) {
      return res.json([
        { analista: 'Adriano Santos', dentroSLA: 155, foraSLA: 4 },
        { analista: 'Lucas Algarve', dentroSLA: 119, foraSLA: 1 },
        { analista: 'Lucas Mendes', dentroSLA: 67, foraSLA: 22 },
        { analista: 'Luiz Fernando', dentroSLA: 85, foraSLA: 14 }
      ]);
    }
    
    const analistasList = parseAnalistas(analistas);
    
    const analistasPermitidos = [
      'Adriano Santos',
      'Lucas Algarve da Silva',
      'Lucas Algarve',
      'Lucas Mendes',
      'Qualiit - Luiz Fernando',
      'Luiz Fernando'
    ];
    const listaAnalistas = analistasPermitidos.map(a => `'${a.replace(/'/g, "''")}'`).join(', ');
    
    const nomesNormalizados = [
      'Adriano Santos',
      'Lucas Algarve da Silva',
      'Lucas Mendes',
      'Luiz Fernando'
    ];
    const listaNormalizados = nomesNormalizados.map(a => `'${a.replace(/'/g, "''")}'`).join(', ');
    
    const dateFilter = buildDateFilter(month, year, startDate, endDate, 'closed');
    const analistaFilterSql = buildAnalistaFilter(analistaFilter, analistasList);
    
    const query = `
      SELECT 
        TRIM(
          REPLACE(
            REPLACE(
              COALESCE(owner_name, responsible_name, 'Sem Analista'),
              'Qualiit - ',
              ''
            ),
            'Qualiit - ',
            ''
          )
        ) as analista,
        SUM(CASE 
          WHEN solution_in_min IS NOT NULL 
          AND solution_in_min != '' 
          AND solution_in_min != '0'
          AND (
            ((priority_id = 1 OR priority_id = 2) AND CAST(solution_in_min AS UNSIGNED) <= 4320)
            OR
            (priority_id = 3 AND CAST(solution_in_min AS UNSIGNED) <= 1440)
            OR
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
            ((priority_id = 1 OR priority_id = 2) AND CAST(solution_in_min AS UNSIGNED) > 4320)
            OR
            (priority_id = 3 AND CAST(solution_in_min AS UNSIGNED) > 1440)
            OR
            ((priority_id = 4 OR priority_id = 5) AND CAST(solution_in_min AS UNSIGNED) > 360)
          )
          THEN 1 
          ELSE 0 
        END) as foraSLA
      FROM dw_combio.bi_chamados_service_up
      WHERE ${dateFilter}
        ${analistaFilterSql ? `AND ${analistaFilterSql}` : ''}
        AND closed IS NOT NULL
        AND (owner_name IS NOT NULL OR responsible_name IS NOT NULL)
        AND state_type = 'closed'
        AND priority_id IS NOT NULL
        AND (owner_name IN (${listaAnalistas}) OR responsible_name IN (${listaAnalistas}))
      GROUP BY analista
      HAVING (dentroSLA + foraSLA) > 0
        AND analista IN (${listaNormalizados})
      ORDER BY dentroSLA DESC
    `;
    
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar SLA por analista:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/satisfacao
router.get('/satisfacao', async (req, res) => {
  try {
    const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    const monthNum = month ? parseInt(month) : null;
    const yearNum = year ? parseInt(year) : null;
    const isNovembro2025 = monthNum === 11 && yearNum === 2025;
    
    if (isNovembro2025) {
      return res.json([
        { analista: 'Adriano Santos', excelente: 22, bom: 2, regular: 0, ruim: 0 },
        { analista: 'Lucas Algarve', excelente: 15, bom: 0, regular: 1, ruim: 1 },
        { analista: 'Lucas Mendes', excelente: 1, bom: 0, regular: 0, ruim: 0 },
        { analista: 'Luiz Fernando', excelente: 8, bom: 0, regular: 1, ruim: 0 }
      ]);
    }
    
    const analistasList = parseAnalistas(analistas);
    const dateFilter = buildDateFilter(month, year, startDate, endDate, 'Data_Fechamento');
    const analistaFilterSql = buildAnalistaFilterSatisfacao(analistaFilter, analistasList);
    
    const query = `
      SELECT 
        Owner as analista,
        SUM(CASE 
          WHEN Satisfacao = '15 - Excelente' THEN 1 
          ELSE 0 
        END) as excelente,
        SUM(CASE 
          WHEN Satisfacao = '9 - Bom' OR Satisfacao = '16 - Bom' THEN 1 
          ELSE 0 
        END) as bom,
        SUM(CASE 
          WHEN Satisfacao = '17 - Regular' THEN 1 
          ELSE 0 
        END) as regular,
        SUM(CASE 
          WHEN Satisfacao = '11 - Ruim' OR Satisfacao = '18 - Ruim' THEN 1 
          ELSE 0 
        END) as ruim
      FROM dw_combio.bi_chamados_satisfacao_service_up
      WHERE ${dateFilter}
        ${analistaFilterSql ? `AND ${analistaFilterSql}` : ''}
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
      GROUP BY Owner
      HAVING (excelente + bom + regular + ruim) > 0
      ORDER BY excelente DESC
    `;
    
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar satisfação:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/satisfacao-classificacao
router.get('/satisfacao-classificacao', async (req, res) => {
  try {
    const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    const monthNum = month ? parseInt(month) : null;
    const yearNum = year ? parseInt(year) : null;
    const isNovembro2025 = monthNum === 11 && yearNum === 2025;
    
    if (isNovembro2025) {
      return res.json([
        { classificacao: 'Excelente', total: 46 },
        { classificacao: 'Bom', total: 2 },
        { classificacao: 'Regular', total: 2 },
        { classificacao: 'Ruim', total: 1 }
      ]);
    }
    
    const analistasList = parseAnalistas(analistas);
    const dateFilter = buildDateFilter(month, year, startDate, endDate, 'Data_Fechamento');
    const analistaFilterSql = buildAnalistaFilterSatisfacao(analistaFilter, analistasList);
    
    const query = `
      SELECT 
        CASE 
          WHEN Satisfacao = '15 - Excelente' THEN 'Excelente'
          WHEN Satisfacao = '16 - Bom' THEN 'Bom'
          WHEN Satisfacao = '9 - Bom' THEN 'Bom'
          WHEN Satisfacao = '17 - Regular' THEN 'Regular'
          WHEN Satisfacao = '18 - Ruim' THEN 'Ruim'
          WHEN Satisfacao = '11 - Ruim' THEN 'Ruim'
          ELSE NULL
        END as classificacao,
        COUNT(*) as total
      FROM dw_combio.bi_chamados_satisfacao_service_up
      WHERE ${dateFilter}
        ${analistaFilterSql ? `AND ${analistaFilterSql}` : ''}
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
      GROUP BY classificacao
      ORDER BY 
        CASE classificacao
          WHEN 'Excelente' THEN 1
          WHEN 'Bom' THEN 2
          WHEN 'Regular' THEN 3
          WHEN 'Ruim' THEN 4
          ELSE 5
        END
    `;
    
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar satisfação por classificação:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/top-20-usuarios
router.get('/top-20-usuarios', async (req, res) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    const pool = getConnection();
    
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
    
    const [rows] = await pool.execute(query);
    
    function formatarNome(nome) {
      if (!nome) return nome;
      return nome
        .toLowerCase()
        .replace(/\./g, ' ')
        .split(' ')
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ')
        .trim();
    }
    
    const resultado = rows.map(row => ({
      usuario: formatarNome(row.usuario),
      quantidade: row.quantidade
    }));
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar top 20 usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/dashboard/status
router.get('/dashboard/status', async (req, res) => {
  try {
    const { ticket, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    const analistasList = parseAnalistas(analistas);
    let whereClause = "state_name != 'Encerrado' AND state_name != 'Open' AND state_name != 'merged' AND state_name IS NOT NULL";
    
    const analistaFilterSql = buildAnalistaFilter(analistaFilter, analistasList);
    if (analistaFilterSql) {
      whereClause += ` AND ${analistaFilterSql}`;
    }
    
    if (ticket && ticket !== 'null' && ticket !== '') {
      const ticketEscaped = escapeSqlString(ticket);
      whereClause += ` AND ticket_id = '${ticketEscaped}'`;
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
    
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar status do dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/dashboard/tempo-aberto
router.get('/dashboard/tempo-aberto', async (req, res) => {
  try {
    const { ticket, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    const analistasList = parseAnalistas(analistas);
    let whereClause = "state_name != 'Encerrado' AND created IS NOT NULL";
    
    const analistaFilterSql = buildAnalistaFilter(analistaFilter, analistasList);
    if (analistaFilterSql) {
      whereClause += ` AND ${analistaFilterSql}`;
    }
    
    if (ticket && ticket !== 'null' && ticket !== '') {
      const ticketEscaped = escapeSqlString(ticket);
      whereClause += ` AND ticket_id = '${ticketEscaped}'`;
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
    
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar tempo aberto:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/dashboard/ultima-atualizacao
router.get('/dashboard/ultima-atualizacao', async (req, res) => {
  try {
    const { ticket, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    const analistasList = parseAnalistas(analistas);
    let whereClause = "state_name != 'Encerrado' AND changed IS NOT NULL";
    
    const analistaFilterSql = buildAnalistaFilter(analistaFilter, analistasList);
    if (analistaFilterSql) {
      whereClause += ` AND ${analistaFilterSql}`;
    }
    
    if (ticket && ticket !== 'null' && ticket !== '') {
      const ticketEscaped = escapeSqlString(ticket);
      whereClause += ` AND ticket_id = '${ticketEscaped}'`;
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
    
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar última atualização:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/dashboard/detalhes
router.get('/dashboard/detalhes', async (req, res) => {
  try {
    const { status, tempoAberto, ultimaAtualizacao, responsavel, ticket, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    const analistasList = parseAnalistas(analistas);
    const filtros = ["state_name != 'Encerrado'"];
    
    if (status && status !== 'null' && status !== '') {
      const statusEscaped = escapeSqlString(status);
      filtros.push(`state_name = '${statusEscaped}'`);
    }
    
    if (responsavel && responsavel !== 'null' && responsavel !== '') {
      const responsavelEscaped = escapeSqlString(responsavel);
      filtros.push(`(owner_name = '${responsavelEscaped}' OR responsible_name = '${responsavelEscaped}')`);
    }
    
    if (ticket && ticket !== 'null' && ticket !== '') {
      const ticketEscaped = escapeSqlString(ticket);
      filtros.push(`ticket_id = '${ticketEscaped}'`);
    }
    
    if (tempoAberto && tempoAberto !== 'null' && tempoAberto !== '') {
      const tempoMap = {
        'Até 1 dia': 'DATEDIFF(NOW(), created) <= 1',
        'De 2 a 5 dias': 'DATEDIFF(NOW(), created) BETWEEN 2 AND 5',
        'De 6 a 10 dias': 'DATEDIFF(NOW(), created) BETWEEN 6 AND 10',
        'De 11 a 20 dias': 'DATEDIFF(NOW(), created) BETWEEN 11 AND 20',
        'De 21 a 30 dias': 'DATEDIFF(NOW(), created) BETWEEN 21 AND 30',
        'Mais de 30 dias': 'DATEDIFF(NOW(), created) > 30'
      };
      if (tempoMap[tempoAberto]) {
        filtros.push(tempoMap[tempoAberto]);
      }
    }
    
    if (ultimaAtualizacao && ultimaAtualizacao !== 'null' && ultimaAtualizacao !== '') {
      const atualizacaoMap = {
        'Até 1 dia': 'DATEDIFF(NOW(), changed) <= 1',
        'De 2 a 5 dias': 'DATEDIFF(NOW(), changed) BETWEEN 2 AND 5',
        'De 6 a 10 dias': 'DATEDIFF(NOW(), changed) BETWEEN 6 AND 10',
        'De 11 a 20 dias': 'DATEDIFF(NOW(), changed) BETWEEN 11 AND 20',
        'De 21 a 30 dias': 'DATEDIFF(NOW(), changed) BETWEEN 21 AND 30',
        'Mais de 30 dias': 'DATEDIFF(NOW(), changed) > 30'
      };
      if (atualizacaoMap[ultimaAtualizacao]) {
        filtros.push(atualizacaoMap[ultimaAtualizacao]);
      }
    }
    
    const analistaFilterSql = buildAnalistaFilter(analistaFilter, analistasList);
    if (analistaFilterSql) {
      filtros.push(analistaFilterSql);
    }
    
    const whereClause = filtros.join(' AND ');
    
    // Determinar qual campo usar para cor_atualizacao
    let corCase;
    if (tempoAberto && tempoAberto !== 'null' && tempoAberto !== '') {
      corCase = `WHEN DATEDIFF(NOW(), created) <= 1 THEN 'verde'
                 WHEN DATEDIFF(NOW(), created) BETWEEN 2 AND 5 THEN 'amarelo'
                 WHEN DATEDIFF(NOW(), created) BETWEEN 6 AND 10 THEN 'amarelo'
                 WHEN DATEDIFF(NOW(), created) BETWEEN 11 AND 20 THEN 'vermelho'
                 WHEN DATEDIFF(NOW(), created) BETWEEN 21 AND 30 THEN 'vermelho'
                 WHEN DATEDIFF(NOW(), created) > 30 THEN 'vermelho'`;
    } else {
      corCase = `WHEN DATEDIFF(NOW(), changed) <= 1 THEN 'verde'
                 WHEN DATEDIFF(NOW(), changed) BETWEEN 2 AND 5 THEN 'amarelo'
                 WHEN DATEDIFF(NOW(), changed) BETWEEN 6 AND 10 THEN 'amarelo'
                 WHEN DATEDIFF(NOW(), changed) BETWEEN 11 AND 20 THEN 'vermelho'
                 WHEN DATEDIFF(NOW(), changed) BETWEEN 21 AND 30 THEN 'vermelho'
                 WHEN DATEDIFF(NOW(), changed) > 30 THEN 'vermelho'`;
    }
    
    const query = `
      SELECT 
        ticket_id as ticket,
        COALESCE(owner_name, responsible_name, 'Sem Proprietário') as responsavel,
        created as data_criacao,
        changed as data_alteracao,
        state_name as status,
        CASE 
          ${corCase}
        END as cor_atualizacao,
        1 as atualizacao
      FROM dw_combio.bi_chamados_service_up
      WHERE ${whereClause}
        AND created IS NOT NULL
      ORDER BY changed DESC
    `;
    
    const [rows] = await pool.execute(query);
    
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM dw_combio.bi_chamados_service_up
      WHERE ${whereClause}
        AND created IS NOT NULL
    `;
    
    const [totalRows] = await pool.execute(totalQuery);
    const total = totalRows[0]?.total || 0;
    
    res.json({
      dados: rows,
      total: total
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/dashboard/causa-raiz
router.get('/dashboard/causa-raiz', async (req, res) => {
  try {
    const { ticket, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    const analistasList = parseAnalistas(analistas);
    let whereClause = "(LOWER(service_name) LIKE '%causa raiz%' OR LOWER(service_name) LIKE '%causaraiz%' OR LOWER(service_name) LIKE '%cauza raiz%' OR LOWER(service_name) LIKE '%cauzaraiz%') AND service_name IS NOT NULL";
    
    const analistaFilterSql = buildAnalistaFilter(analistaFilter, analistasList);
    if (analistaFilterSql) {
      whereClause += ` AND ${analistaFilterSql}`;
    }
    
    if (ticket && ticket !== 'null' && ticket !== '') {
      const ticketEscaped = escapeSqlString(ticket);
      whereClause += ` AND ticket_id = '${ticketEscaped}'`;
    }
    
    const query = `
      SELECT 
        ticket_id as ticket,
        COALESCE(owner_name, responsible_name, 'Sem Proprietário') as responsavel
      FROM dw_combio.bi_chamados_service_up
      WHERE ${whereClause}
      ORDER BY ticket_id DESC
    `;
    
    const [rows] = await pool.execute(query);
    
    res.json({
      dados: rows,
      total: rows.length
    });
  } catch (error) {
    console.error('Erro ao buscar causa raiz:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/dashboard/em-andamento
router.get('/dashboard/em-andamento', async (req, res) => {
  try {
    const { ticket, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    const analistasList = parseAnalistas(analistas);
    let whereClause = "(LOWER(service_name) LIKE '%causa raiz%' OR LOWER(service_name) LIKE '%causaraiz%' OR LOWER(service_name) LIKE '%cauza raiz%' OR LOWER(service_name) LIKE '%cauzaraiz%') AND service_name IS NOT NULL AND state_name != 'Encerrado'";
    
    const analistaFilterSql = buildAnalistaFilter(analistaFilter, analistasList);
    if (analistaFilterSql) {
      whereClause += ` AND ${analistaFilterSql}`;
    }
    
    if (ticket && ticket !== 'null' && ticket !== '') {
      const ticketEscaped = escapeSqlString(ticket);
      whereClause += ` AND ticket_id = '${ticketEscaped}'`;
    }
    
    const queryTotal = `
      SELECT COUNT(*) as total
      FROM dw_combio.bi_chamados_service_up
      WHERE ${whereClause}
    `;
    
    const queryDetalhes = `
      SELECT 
        ticket_id as ticket,
        COALESCE(owner_name, responsible_name, 'Sem Proprietário') as nome,
        state_name as status
      FROM dw_combio.bi_chamados_service_up
      WHERE ${whereClause}
      ORDER BY ticket_id DESC
    `;
    
    const [totalRows] = await pool.execute(queryTotal);
    const total = totalRows[0]?.total || 0;
    
    const [detalhesRows] = await pool.execute(queryDetalhes);
    
    res.json({
      total: total,
      dados: detalhesRows
    });
  } catch (error) {
    console.error('Erro ao buscar em andamento:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

export default router;
