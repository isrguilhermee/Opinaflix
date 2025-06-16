import { db } from '../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new Response(JSON.stringify({ 
        success: false, 
        isAdmin: false,
        message: 'Usuário não autenticado' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar se o usuário é administrador
    const [userCheck] = await db.query(
      'SELECT id, username, email, is_admin FROM tb_users WHERE id = ?',
      [session.user.id]
    );

    if (!userCheck || userCheck.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        isAdmin: false,
        message: 'Usuário não encontrado' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      isAdmin: !!userCheck[0].is_admin,
      user: {
        id: userCheck[0].id,
        username: userCheck[0].username,
        email: userCheck[0].email
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      isAdmin: false,
      message: 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 