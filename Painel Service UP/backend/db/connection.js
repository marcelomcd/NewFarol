import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuração de conexão MySQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'dw_combio', // Database fixo conforme GRANT
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Criar pool de conexões
let pool = null;

export const createConnection = () => {
    if (!pool) {
        pool = mysql.createPool(dbConfig);
        console.log('✅ Pool de conexões MySQL criado');
    }
    return pool;
};

export const getConnection = () => {
    if (!pool) {
        createConnection();
    }
    return pool;
};

// Função para testar conexão
export const testConnection = async () => {
    try {
        const connection = getConnection();
        const [rows] = await connection.query('SELECT 1 as test');
        console.log('✅ Conexão MySQL testada com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar ao MySQL:', error.message);
        return false;
    }
};

