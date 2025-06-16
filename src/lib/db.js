import mysql from 'mysql2/promise';

// Configuração do pool de conexões
const createPool = () => {
  try {
    return mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'db_opinaflix', // Usando o nome correto do banco
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  } catch (error) {
    console.error('Erro ao criar pool de conexões MySQL:', error);
    return null;
  }
};

// Cria um objeto db com método query mais seguro
export const db = {
  pool: createPool(),
  
  async query(sql, params) {
    if (!this.pool) {
      console.error('Pool de conexões não inicializado!');
      return [[], null];
    }

    try {
      return await this.pool.query(sql, params);
    } catch (error) {
      console.error('Erro na execução da query:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error; // Propaga o erro para ser tratado nos endpoints
    }
  }
};
