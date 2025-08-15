const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });

async function checkDatabase() {
  try {
    // Configurações do banco de dados
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cine_db',
    });

    console.log('Conexão com o banco de dados estabelecida');

    // Verificar tabela de usuários
    console.log('\n--- Verificando estrutura da tabela tb_users ---');
    const [tableInfo] = await connection.query('DESCRIBE tb_users');
    
    console.log('Colunas da tabela tb_users:');
    tableInfo.forEach(column => {
      console.log(`- ${column.Field} (${column.Type}) ${column.Null === 'NO' ? 'NOT NULL' : ''} ${column.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
    });

    // Verificar se a coluna image_url existe
    const hasImageColumn = tableInfo.some(column => column.Field === 'image_url');
    
    if (!hasImageColumn) {
      console.log('\nA coluna image_url não existe. Criando...');
      await connection.query('ALTER TABLE tb_users ADD COLUMN image_url VARCHAR(255)');
      console.log('Coluna image_url criada com sucesso');
    } else {
      console.log('\nA coluna image_url já existe');
    }

    // Verificar um usuário de exemplo
    console.log('\n--- Verificando um usuário de exemplo ---');
    const [users] = await connection.query('SELECT id, username, email, image_url FROM tb_users LIMIT 1');
    
    if (users.length > 0) {
      console.log('Usuário encontrado:');
      console.log(users[0]);
    } else {
      console.log('Nenhum usuário encontrado');
    }

    await connection.end();
    console.log('\nVerificação concluída');

  } catch (error) {
    console.error('Erro ao verificar banco de dados:', error);
  }
}

checkDatabase(); 