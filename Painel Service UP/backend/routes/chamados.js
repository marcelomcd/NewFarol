import express from 'express';
import { getConnection } from '../db/connection.js';

const router = express.Router();

// Helper para parsear parâmetros de analistas
function parseAnalistas(analistasParam) {
  if (!analistasParam) return null;
  try {
    return JSON.parse(analistasParam);
  } catch {
    return null;
  }
}

// GET /api/chamados/lista-analistas
router.get('/lista-analistas', async (req, res) => {
  try {
    const pool = getConnection();
    const [rows] = await pool.execute(
      `SELECT DISTINCT responsavel 
       FROM chamados 
       WHERE responsavel IS NOT NULL AND responsavel != ''
       ORDER BY responsavel ASC`
    );
    res.json(rows.map(row => row.responsavel));
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
    
    let query = `
      SELECT 
        DATE_FORMAT(data_fechamento, '%Y-%m') as mes,
        COUNT(*) as total
      FROM chamados
      WHERE data_fechamento IS NOT NULL
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND data_fechamento BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (year) {
      query += ' AND YEAR(data_fechamento) = ?';
      params.push(year);
      if (month) {
        query += ' AND MONTH(data_fechamento) = ?';
        params.push(month);
      }
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY DATE_FORMAT(data_fechamento, "%Y-%m") ORDER BY mes ASC';
    
    const [rows] = await pool.execute(query, params);
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
    
    let query = `
      SELECT 
        CASE 
          WHEN status = 'Fechado' THEN 'Fechado'
          ELSE 'Aberto'
        END as status,
        COUNT(*) as total
      FROM chamados
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND (data_abertura BETWEEN ? AND ? OR data_fechamento BETWEEN ? AND ?)';
      params.push(startDate, endDate, startDate, endDate);
    } else if (year) {
      query += ' AND (YEAR(data_abertura) = ? OR YEAR(data_fechamento) = ?)';
      params.push(year, year);
      if (month) {
        query += ' AND (MONTH(data_abertura) = ? OR MONTH(data_fechamento) = ?)';
        params.push(month, month);
      }
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY status';
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
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
    
    let query = `
      SELECT 
        dominio,
        COUNT(*) as total
      FROM chamados
      WHERE dominio IS NOT NULL AND dominio != ''
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND (data_abertura BETWEEN ? AND ? OR data_fechamento BETWEEN ? AND ?)';
      params.push(startDate, endDate, startDate, endDate);
    } else if (year) {
      query += ' AND (YEAR(data_abertura) = ? OR YEAR(data_fechamento) = ?)';
      params.push(year, year);
      if (month) {
        query += ' AND (MONTH(data_abertura) = ? OR MONTH(data_fechamento) = ?)';
        params.push(month, month);
      }
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY dominio ORDER BY total DESC';
    
    const [rows] = await pool.execute(query, params);
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
    
    let query = `
      SELECT 
        DATE_FORMAT(data_fechamento, '%Y-%m') as mes,
        COUNT(*) as total
      FROM chamados
      WHERE dominio = 'Datasul' AND data_fechamento IS NOT NULL
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND data_fechamento BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (year) {
      query += ' AND YEAR(data_fechamento) = ?';
      params.push(year);
      if (month) {
        query += ' AND MONTH(data_fechamento) = ?';
        params.push(month);
      }
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY DATE_FORMAT(data_fechamento, "%Y-%m") ORDER BY mes ASC';
    
    const [rows] = await pool.execute(query, params);
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
    
    let query = `
      SELECT 
        DATE_FORMAT(data_fechamento, '%Y-%m') as mes,
        COUNT(*) as total
      FROM chamados
      WHERE dominio = 'Fluig' AND data_fechamento IS NOT NULL
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND data_fechamento BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (year) {
      query += ' AND YEAR(data_fechamento) = ?';
      params.push(year);
      if (month) {
        query += ' AND MONTH(data_fechamento) = ?';
        params.push(month);
      }
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY DATE_FORMAT(data_fechamento, "%Y-%m") ORDER BY mes ASC';
    
    const [rows] = await pool.execute(query, params);
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
    
    let query = `
      SELECT 
        responsavel,
        COUNT(*) as total
      FROM chamados
      WHERE responsavel IS NOT NULL AND responsavel != ''
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND (data_abertura BETWEEN ? AND ? OR data_fechamento BETWEEN ? AND ?)';
      params.push(startDate, endDate, startDate, endDate);
    } else if (year) {
      query += ' AND (YEAR(data_abertura) = ? OR YEAR(data_fechamento) = ?)';
      params.push(year, year);
      if (month) {
        query += ' AND (MONTH(data_abertura) = ? OR MONTH(data_fechamento) = ?)';
        params.push(month, month);
      }
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY responsavel ORDER BY total DESC';
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar analistas:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/sla
router.get('/sla', async (req, res) => {
  try {
    const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    let query = `
      SELECT 
        DATE_FORMAT(data_fechamento, '%Y-%m') as mes,
        COUNT(*) as total,
        SUM(CASE WHEN dentro_sla = 1 THEN 1 ELSE 0 END) as dentro_sla,
        SUM(CASE WHEN dentro_sla = 0 THEN 1 ELSE 0 END) as fora_sla
      FROM chamados
      WHERE data_fechamento IS NOT NULL
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND data_fechamento BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (year) {
      query += ' AND YEAR(data_fechamento) = ?';
      params.push(year);
      if (month) {
        query += ' AND MONTH(data_fechamento) = ?';
        params.push(month);
      }
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY DATE_FORMAT(data_fechamento, "%Y-%m") ORDER BY mes ASC';
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar SLA:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// GET /api/chamados/sla-analista
router.get('/sla-analista', async (req, res) => {
  try {
    const { month, year, startDate, endDate, analistaFilter, analistas } = req.query;
    const pool = getConnection();
    
    let query = `
      SELECT 
        responsavel,
        COUNT(*) as total,
        SUM(CASE WHEN dentro_sla = 1 THEN 1 ELSE 0 END) as dentro_sla,
        SUM(CASE WHEN dentro_sla = 0 THEN 1 ELSE 0 END) as fora_sla
      FROM chamados
      WHERE data_fechamento IS NOT NULL AND responsavel IS NOT NULL
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND data_fechamento BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (year) {
      query += ' AND YEAR(data_fechamento) = ?';
      params.push(year);
      if (month) {
        query += ' AND MONTH(data_fechamento) = ?';
        params.push(month);
      }
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY responsavel ORDER BY total DESC';
    
    const [rows] = await pool.execute(query, params);
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
    
    let query = `
      SELECT 
        responsavel,
        AVG(satisfacao) as media_satisfacao,
        COUNT(*) as total
      FROM chamados
      WHERE satisfacao IS NOT NULL
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND (data_abertura BETWEEN ? AND ? OR data_fechamento BETWEEN ? AND ?)';
      params.push(startDate, endDate, startDate, endDate);
    } else if (year) {
      query += ' AND (YEAR(data_abertura) = ? OR YEAR(data_fechamento) = ?)';
      params.push(year, year);
      if (month) {
        query += ' AND (MONTH(data_abertura) = ? OR MONTH(data_fechamento) = ?)';
        params.push(month, month);
      }
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY responsavel ORDER BY media_satisfacao DESC';
    
    const [rows] = await pool.execute(query, params);
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
    
    let query = `
      SELECT 
        CASE 
          WHEN satisfacao >= 4 THEN 'Ótimo'
          WHEN satisfacao >= 3 THEN 'Bom'
          WHEN satisfacao >= 2 THEN 'Regular'
          WHEN satisfacao >= 1 THEN 'Ruim'
          ELSE 'Sem avaliação'
        END as classificacao,
        COUNT(*) as total
      FROM chamados
      WHERE satisfacao IS NOT NULL
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND (data_abertura BETWEEN ? AND ? OR data_fechamento BETWEEN ? AND ?)';
      params.push(startDate, endDate, startDate, endDate);
    } else if (year) {
      query += ' AND (YEAR(data_abertura) = ? OR YEAR(data_fechamento) = ?)';
      params.push(year, year);
      if (month) {
        query += ' AND (MONTH(data_abertura) = ? OR MONTH(data_fechamento) = ?)';
        params.push(month, month);
      }
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY classificacao ORDER BY total DESC';
    
    const [rows] = await pool.execute(query, params);
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
    
    let query = `
      SELECT 
        usuario,
        COUNT(*) as total
      FROM chamados
      WHERE usuario IS NOT NULL AND usuario != ''
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND (data_abertura BETWEEN ? AND ? OR data_fechamento BETWEEN ? AND ?)';
      params.push(startDate, endDate, startDate, endDate);
    } else if (year) {
      query += ' AND (YEAR(data_abertura) = ? OR YEAR(data_fechamento) = ?)';
      params.push(year, year);
      if (month) {
        query += ' AND (MONTH(data_abertura) = ? OR MONTH(data_fechamento) = ?)';
        params.push(month, month);
      }
    }
    
    query += ' GROUP BY usuario ORDER BY total DESC LIMIT 20';
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
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
    
    let query = 'SELECT status, COUNT(*) as total FROM chamados WHERE 1=1';
    const params = [];
    
    if (ticket) {
      query += ' AND ticket = ?';
      params.push(ticket);
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY status';
    
    const [rows] = await pool.execute(query, params);
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
    
    let query = `
      SELECT 
        CASE 
          WHEN DATEDIFF(NOW(), data_abertura) <= 7 THEN '0-7 dias'
          WHEN DATEDIFF(NOW(), data_abertura) <= 15 THEN '8-15 dias'
          WHEN DATEDIFF(NOW(), data_abertura) <= 30 THEN '16-30 dias'
          ELSE 'Mais de 30 dias'
        END as faixa_tempo,
        COUNT(*) as total
      FROM chamados
      WHERE status != 'Fechado'
    `;
    
    const params = [];
    
    if (ticket) {
      query += ' AND ticket = ?';
      params.push(ticket);
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY faixa_tempo';
    
    const [rows] = await pool.execute(query, params);
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
    
    let query = `
      SELECT 
        CASE 
          WHEN DATEDIFF(NOW(), ultima_atualizacao) <= 1 THEN 'Hoje'
          WHEN DATEDIFF(NOW(), ultima_atualizacao) <= 7 THEN 'Esta semana'
          WHEN DATEDIFF(NOW(), ultima_atualizacao) <= 30 THEN 'Este mês'
          ELSE 'Mais de 30 dias'
        END as periodo,
        COUNT(*) as total
      FROM chamados
      WHERE 1=1
    `;
    
    const params = [];
    
    if (ticket) {
      query += ' AND ticket = ?';
      params.push(ticket);
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY periodo';
    
    const [rows] = await pool.execute(query, params);
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
    
    let query = 'SELECT * FROM chamados WHERE 1=1';
    const params = [];
    
    if (ticket) {
      query += ' AND ticket = ?';
      params.push(ticket);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (responsavel) {
      query += ' AND responsavel = ?';
      params.push(responsavel);
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' LIMIT 100';
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
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
    
    let query = `
      SELECT 
        causa_raiz,
        COUNT(*) as total
      FROM chamados
      WHERE causa_raiz IS NOT NULL AND causa_raiz != ''
    `;
    
    const params = [];
    
    if (ticket) {
      query += ' AND ticket = ?';
      params.push(ticket);
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY causa_raiz ORDER BY total DESC';
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
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
    
    let query = `
      SELECT 
        responsavel,
        COUNT(*) as total
      FROM chamados
      WHERE status != 'Fechado' AND responsavel IS NOT NULL
    `;
    
    const params = [];
    
    if (ticket) {
      query += ' AND ticket = ?';
      params.push(ticket);
    }
    
    if (analistaFilter && analistaFilter !== 'todos') {
      const analistasList = parseAnalistas(analistas);
      if (analistasList && analistasList.length > 0) {
        query += ' AND responsavel IN (' + analistasList.map(() => '?').join(',') + ')';
        params.push(...analistasList);
      } else if (analistaFilter !== 'todos') {
        query += ' AND responsavel = ?';
        params.push(analistaFilter);
      }
    }
    
    query += ' GROUP BY responsavel ORDER BY total DESC';
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar em andamento:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

export default router;
