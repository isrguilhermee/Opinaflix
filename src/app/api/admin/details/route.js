import { db } from '../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    
    const type = searchParams.get('type'); // users, reviews, ratings, etc
    const dateFilter = searchParams.get('dateFilter') || '6months';
    const ratingFilter = searchParams.get('ratingFilter') || 'all';

    if (!session || !session.user) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Acesso negado' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar se o usuário é administrador
    const [userCheck] = await db.query(
      'SELECT id, is_admin FROM tb_users WHERE id = ?',
      [session.user.id]
    );

    if (!userCheck || userCheck.length === 0 || !userCheck[0].is_admin) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Permissões de administrador necessárias' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Construir condições de filtro
    let dateCondition = '';
    let ratingCondition = '';
    
    switch (dateFilter) {
      case '1month':
        dateCondition = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
        break;
      case '3months':
        dateCondition = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
        break;
      case '6months':
        dateCondition = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)';
        break;
      case '1year':
        dateCondition = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
        break;
      default:
        dateCondition = '';
    }

    switch (ratingFilter) {
      case 'high':
        ratingCondition = dateCondition ? 'AND rating >= 7' : 'WHERE rating >= 7';
        break;
      case 'medium':
        ratingCondition = dateCondition ? 'AND rating >= 4 AND rating < 7' : 'WHERE rating >= 4 AND rating < 7';
        break;
      case 'low':
        ratingCondition = dateCondition ? 'AND rating < 4' : 'WHERE rating < 4';
        break;
      default:
        ratingCondition = '';
    }

    let data = null;

    switch (type) {
      case 'users':
        // Detalhes dos usuários
        // Detalhes dos usuários - versão simples
        const [users] = await db.query(`
          SELECT 
            u.id,
            u.username,
            u.email,
            u.created_at,
            COUNT(r.id) as review_count,
            AVG(r.rating) as avg_rating,
            MAX(r.created_at) as last_review
          FROM tb_users u
          LEFT JOIN tb_reviews r ON u.id = r.userId
          GROUP BY u.id, u.username, u.email, u.created_at
          ORDER BY u.created_at DESC
          LIMIT 100
        `);
        data = users;
        break;

      case 'reviews':
        // Detalhes das avaliações - versão simples
        const [reviews] = await db.query(`
          SELECT 
            r.id,
            r.movieTitle,
            r.rating,
            r.content,
            r.created_at,
            u.username,
            u.email
          FROM tb_reviews r
          LEFT JOIN tb_users u ON r.userId = u.id
          ORDER BY r.created_at DESC
          LIMIT 100
        `);
        data = reviews;
        break;

      case 'movies':
        // Detalhes dos filmes mais avaliados - versão simples
        const [movies] = await db.query(`
          SELECT 
            movieTitle,
            movieId,
            COUNT(*) as review_count,
            AVG(rating) as avg_rating,
            MIN(rating) as min_rating,
            MAX(rating) as max_rating,
            MAX(created_at) as last_review
          FROM tb_reviews
          GROUP BY movieId, movieTitle
          HAVING COUNT(*) > 0
          ORDER BY review_count DESC, avg_rating DESC
          LIMIT 50
        `);
        data = movies;
        break;

      case 'ratings':
        // Detalhes da distribuição de ratings - versão simples
        const [ratings] = await db.query(`
          SELECT 
            r.rating,
            r.movieTitle,
            u.username,
            r.created_at
          FROM tb_reviews r
          LEFT JOIN tb_users u ON r.userId = u.id
          ORDER BY r.rating DESC, r.created_at DESC
          LIMIT 200
        `);
        data = ratings;
        break;

      default:
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Tipo de dados não especificado' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data,
      type,
      count: data.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na API de detalhes:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 