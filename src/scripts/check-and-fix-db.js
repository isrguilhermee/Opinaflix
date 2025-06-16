const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function checkAndFixDatabase() {
  let connection;
  
  try {
    console.log('Verificando e corrigindo banco de dados...');
    
    // Lê as configurações do banco de dados do arquivo .env
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cine_db',
      multipleStatements: true // Importante para executar múltiplos comandos SQL
    };
    
    console.log('Configuração do banco de dados:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database
    });
    
    // Conectar ao banco de dados
    console.log('Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexão estabelecida com sucesso!');
    
    // Verificar se a tabela tb_users existe
    console.log('\nVerificando tabela tb_users...');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tb_users'
    `, [dbConfig.database]);
    
    if (tables.length === 0) {
      console.log('A tabela tb_users não existe. Criando...');
      // Ler o arquivo SQL de criação da tabela
      const sqlFile = path.join(__dirname, 'create-database-tables.sql');
      const sql = fs.readFileSync(sqlFile, 'utf8');
      
      // Executar o SQL
      await connection.query(sql);
      console.log('Tabela tb_users criada com sucesso!');
    } else {
      console.log('A tabela tb_users já existe.');
      
      // Verificar se a coluna image_url existe
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tb_users' AND COLUMN_NAME = 'image_url'
      `, [dbConfig.database]);
      
      if (columns.length === 0) {
        console.log('A coluna image_url não existe. Adicionando...');
        await connection.query('ALTER TABLE tb_users ADD COLUMN image_url VARCHAR(255)');
        console.log('Coluna image_url adicionada com sucesso!');
      } else {
        console.log('A coluna image_url já existe.');
      }
    }
    
    // Verificar a estrutura completa da tabela tb_users
    console.log('\nEstrutura da tabela tb_users:');
    const [tableInfo] = await connection.query('DESCRIBE tb_users');
    tableInfo.forEach(column => {
      console.log(`- ${column.Field} (${column.Type}) ${column.Null === 'NO' ? 'NOT NULL' : ''} ${column.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
    });
    
    // Verificar se existem usuários no banco
    console.log('\nVerificando usuários existentes...');
    const [users] = await connection.query('SELECT id, username, email, image_url FROM tb_users LIMIT 5');
    
    if (users.length > 0) {
      console.log(`Encontrados ${users.length} usuários:`);
      users.forEach((user, index) => {
        console.log(`\nUsuário ${index + 1}:`);
        console.log(`- ID: ${user.id}`);
        console.log(`- Nome: ${user.username}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Imagem: ${user.image_url || '(nenhuma)'}`);
      });
    } else {
      console.log('Nenhum usuário encontrado no banco de dados.');
    }
    
    console.log('\nVerificação e correção concluídas com sucesso!');
  } catch (error) {
    console.error('Erro ao verificar/corrigir banco de dados:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexão com o banco de dados encerrada.');
    }
  }
}

// Executar a função
checkAndFixDatabase(); 