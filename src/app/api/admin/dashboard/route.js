import { db } from '../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    
    // Parâmetros de filtro
    const dateFilter = searchParams.get('dateFilter') || '6months';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const ratingFilter = searchParams.get('ratingFilter') || 'all';

    if (!session || !session.user) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Acesso negado - faça login como administrador' 
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
        message: 'Usuário não encontrado' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar se o usuário é administrador
    if (!userCheck[0].is_admin) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Acesso negado - permissões de administrador necessárias' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Construir condições de filtro baseadas nos parâmetros
    let dateCondition = '';
    let ratingCondition = '';
    
    // Filtro de data
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

    // Filtro de rating
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

    // Buscar estatísticas gerais com filtros
    const [totalUsers] = await db.query(`SELECT COUNT(*) as count FROM tb_users ${dateCondition.replace('created_at', 'tb_users.created_at')}`);
    const [totalReviews] = await db.query(`SELECT COUNT(*) as count FROM tb_reviews ${dateCondition} ${ratingCondition}`);
    const [avgRating] = await db.query(`SELECT AVG(rating) as avg FROM tb_reviews ${dateCondition} ${ratingCondition}`);
    const [avgReviewsPerUser] = await db.query(`
      SELECT AVG(review_count) as avg FROM (
        SELECT COUNT(*) as review_count 
        FROM tb_reviews 
        ${dateCondition} ${ratingCondition}
        GROUP BY userId
      ) as user_reviews
    `);

    // Buscar usuários mais ativos
    const [mostActiveUsers] = await db.query(`
      SELECT u.username, u.email, COUNT(r.id) as review_count
      FROM tb_users u
      LEFT JOIN tb_reviews r ON u.id = r.userId
      GROUP BY u.id, u.username, u.email
      ORDER BY review_count DESC
      LIMIT 10
    `);

    // Buscar distribuição de ratings
    const [ratingDistribution] = await db.query(`
      SELECT 
        CASE 
          WHEN rating <= 2 THEN '0-2'
          WHEN rating <= 4 THEN '2-4'
          WHEN rating <= 6 THEN '4-6'
          WHEN rating <= 8 THEN '6-8'
          ELSE '8-10'
        END as rating_range,
        COUNT(*) as count
      FROM tb_reviews
      GROUP BY rating_range
      ORDER BY rating_range
    `);

    // Buscar filmes mais avaliados
    const [mostReviewedMovies] = await db.query(`
      SELECT movieTitle, COUNT(*) as review_count, AVG(rating) as avg_rating
      FROM tb_reviews
      GROUP BY movieId, movieTitle
      ORDER BY review_count DESC
      LIMIT 10
    `);

    // Buscar registros por mês (últimos 4 meses + atual = 5 meses)
    const [monthlyUsersRaw] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        LOWER(DATE_FORMAT(created_at, '%b %Y')) as formatted_month,
        COUNT(*) as count
      FROM tb_users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 4 MONTH)
      GROUP BY month, formatted_month
      ORDER BY month
    `);

    // Buscar avaliações por mês (últimos 4 meses + atual = 5 meses)
    const [monthlyReviewsRaw] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        LOWER(DATE_FORMAT(created_at, '%b %Y')) as formatted_month,
        COUNT(*) as count
      FROM tb_reviews
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 4 MONTH)
      GROUP BY month, formatted_month
      ORDER BY month
    `);

    // Função para gerar últimos 5 meses (4 anteriores + atual)
    const generateLast5Months = () => {
      const months = [];
      const currentDate = new Date();
      
      for (let i = 4; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const month = date.toISOString().slice(0, 7); // YYYY-MM
        const formatted_month = date.toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: 'numeric' 
        }).replace('.', '').toLowerCase();
        
        months.push({ month, formatted_month, count: 0 });
      }
      
      return months;
    };

    // Preencher dados faltantes para usuários
    const monthlyUsers = generateLast5Months().map(template => {
      const found = monthlyUsersRaw.find(item => item.month === template.month);
      return found || template;
    });

    // Preencher dados faltantes para avaliações
    const monthlyReviews = generateLast5Months().map(template => {
      const found = monthlyReviewsRaw.find(item => item.month === template.month);
      return found || template;
    });

    const dashboardData = {
      totalUsers: totalUsers[0]?.count || 0,
      totalReviews: totalReviews[0]?.count || 0,
      avgRating: parseFloat(avgRating[0]?.avg || 0).toFixed(1),
      avgReviewsPerUser: parseFloat(avgReviewsPerUser[0]?.avg || 0).toFixed(1),
      mostActiveUsers: mostActiveUsers || [],
      ratingDistribution: ratingDistribution || [],
      mostReviewedMovies: mostReviewedMovies || [],
      monthlyUsers: monthlyUsers,
      monthlyReviews: monthlyReviews
    };

    return new Response(JSON.stringify({ 
      success: true, 
      data: dashboardData 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no dashboard API:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 