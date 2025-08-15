import { db } from '../../../../lib/db';

export async function GET(req) {
  try {
    // Buscar todos os usuários (sem senhas)
    const [users] = await db.query(
      'SELECT id, username, email, created_at FROM tb_users ORDER BY id'
    );
    
    console.log('Usuários encontrados:', users.length);
    if (users.length > 0) {
      console.log('Primeiro usuário:', {
        id: users[0].id,
        username: users[0].username,
        email: users[0].email,
        idType: typeof users[0].id
      });
    }
    
    return new Response(JSON.stringify({ success: true, users: users || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return new Response(JSON.stringify({ success: false, message: 'Erro interno do servidor', users: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 