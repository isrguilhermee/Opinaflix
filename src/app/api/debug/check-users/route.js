import { db } from '../../../../lib/db';

export async function GET(req) {
  try {
    // Buscar todos os usuários com suas informações básicas
    const [users] = await db.query(
      'SELECT id, username, email, created_at FROM tb_users ORDER BY id'
    );
    
    console.log('=== VERIFICAÇÃO DE USUÁRIOS ===');
    console.log('Total de usuários encontrados:', users.length);
    
    users.forEach((user, index) => {
      console.log(`Usuário ${index + 1}:`, {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      });
    });
    
    // Verificar especificamente os usuários zezinho e zezao
    const zezinho = users.find(u => u.username === 'zezinho');
    const zezao = users.find(u => u.username === 'zezao');
    
    const analysis = {
      totalUsers: users.length,
      allUsers: users,
      zezinho: zezinho || null,
      zezao: zezao || null,
      possibleEmails: {
        zezinho: [
          'zezinho@email.com',
          'zezinho@teste.com', 
          'teste@teste.com',
          'zezinho@gmail.com'
        ],
        zezao: [
          'zezao@email.com',
          'zezao@teste.com',
          'teste@gmail.com',
          'zezao@gmail.com'
        ]
      },
      possiblePasswords: [
        'teste',        // ← SENHA CORRETA!
        'senha123',
        '123456',
        'password',
        'admin'
      ]
    };
    
    console.log('Análise:', analysis);
    console.log('===============================');
    
    return new Response(JSON.stringify({ success: true, data: analysis }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao verificar usuários:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 