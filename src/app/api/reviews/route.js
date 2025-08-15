import { db } from '../../../lib/db';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const movieId = searchParams.get('movieId');

    if (!movieId) {
      return new Response(JSON.stringify({ success: false, message: 'Movie ID is required', reviews: [] }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Converter o movieId para string para garantir compatibilidade
    const movieIdStr = String(movieId);

    try {
      // Buscar as avaliações do banco de dados
      const [reviews] = await db.query(
        `SELECT r.id, r.userId, r.movieId, r.movieTitle, r.rating, r.content, r.created_at, 
                u.username, u.email, u.image_url
         FROM tb_reviews r 
         LEFT JOIN tb_users u ON r.userId = u.id 
         WHERE r.movieId = ? 
         ORDER BY r.created_at DESC`,
        [movieIdStr]
      );
      
      console.log('Reviews encontradas:', reviews.length);
      if (reviews.length > 0) {
        console.log('Primeira review:', {
          id: reviews[0].id,
          userId: reviews[0].userId,
          username: reviews[0].username
        });
      }
      
      return new Response(JSON.stringify({ success: true, reviews: reviews || [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (dbError) {
      console.error('Erro no banco de dados:', dbError);
      return new Response(JSON.stringify({ success: false, message: 'Database error', reviews: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(JSON.stringify({ success: false, message: 'Internal server error', reviews: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req) {
  try {
    console.log('Iniciando POST /api/reviews');
    const session = await getServerSession(authOptions);

    console.log('Sessão atual:', session);

    if (!session) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Você precisa estar logado para avaliar um filme',
        debug: 'Sessão não encontrada'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar se o usuário existe na sessão
    if (!session.user) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Dados do usuário não encontrados',
        debug: 'session.user não existe'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Pegar o userId da sessão
    const userId = session.user.id;
    console.log('ID do usuário encontrado na sessão:', userId);
    
    if (!userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Dados do usuário não encontrados',
        debug: 'ID do usuário não encontrado na sessão'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar se o usuário existe no banco de dados
    const [userExists] = await db.query('SELECT id FROM tb_users WHERE id = ?', [userId]);
    
    if (!userExists || userExists.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Usuário não encontrado',
        debug: 'ID do usuário não encontrado no banco de dados'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { movieId, movieTitle, rating, content } = await req.json();
    console.log('Dados da avaliação recebidos:', { movieId, movieTitle, rating, content });

    if (!movieId || !movieTitle || rating === null || rating === undefined || !content) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Todos os campos são obrigatórios'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar se rating está no range correto
    if (rating < 0 || rating > 10) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'A nota deve estar entre 0 e 10'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Inserir nova avaliação
    try {
      console.log('Inserindo nova avaliação com dados:', {
        userId,
        movieId,
        movieTitle,
        rating,
        content
      });

      const [result] = await db.query(
        `INSERT INTO tb_reviews (userId, movieId, movieTitle, rating, content) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, movieId, movieTitle, rating, content]
      );

      console.log('Avaliação inserida com sucesso:', result);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Avaliação criada com sucesso!',
          reviewId: result.insertId,
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (dbError) {
      console.error('Erro ao inserir avaliação:', dbError);
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Erro ao salvar a avaliação',
        debug: dbError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Ocorreu um erro ao criar a avaliação',
      debug: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 