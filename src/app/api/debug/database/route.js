import { db } from '../../../../lib/db';

export async function GET(req) {
  try {
    const results = {};

    // Verificar estrutura da tabela de usuários
    const [usersStructure] = await db.query('DESCRIBE tb_users');
    results.usersStructure = usersStructure;

    // Verificar estrutura da tabela de avaliações
    const [reviewsStructure] = await db.query('DESCRIBE tb_reviews');
    results.reviewsStructure = reviewsStructure;

    // Buscar alguns usuários para análise
    const [users] = await db.query('SELECT id, username, email FROM tb_users LIMIT 5');
    results.sampleUsers = users;

    // Buscar algumas avaliações para análise
    const [reviews] = await db.query('SELECT id, userId, movieTitle, rating FROM tb_reviews LIMIT 5');
    results.sampleReviews = reviews;

    // Verificar tipos de dados
    results.dataTypes = {
      users: users.map(user => ({
        id: user.id,
        idType: typeof user.id,
        username: user.username,
        usernameType: typeof user.username
      })),
      reviews: reviews.map(review => ({
        id: review.id,
        idType: typeof review.id,
        userId: review.userId,
        userIdType: typeof review.userId
      }))
    };

    console.log('Estrutura do banco analisada:', results);

    return new Response(JSON.stringify({ success: true, data: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao analisar banco:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 