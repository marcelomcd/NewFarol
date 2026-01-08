import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

export function createConnection() {
  if (pool) {
    return pool;
  }

  const config = {
    host: process.env.DB_HOST || '179.191.91.6',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'Combio.biomassa',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dw_combio',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };

  pool = mysql.createPool(config);

  pool.getConnection()
    .then((connection) => {
      console.log('✅ Conectado ao banco de dados MySQL');
      connection.release();
    })
    .catch((err) => {
      console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    });

  return pool;
}

export function getConnection() {
  if (!pool) {
    createConnection();
  }
  return pool;
}

export default getConnection;
