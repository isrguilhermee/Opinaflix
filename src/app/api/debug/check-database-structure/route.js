import { db } from '../../../../lib/db';

export async function GET(req) {
  try {
    // Verificar estrutura da tabela tb_reviews
    const [reviewsStructure] = await db.query('DESCRIBE tb_reviews');
    
    // Verificar estrutura da tabela tb_users
    const [usersStructure] = await db.query('DESCRIBE tb_users');
    
    // Buscar algumas avaliações para ver os tipos de dados
    const [sampleReviews] = await db.query(
      `SELECT r.id, r.userId, r.movieId, r.rating, r.content, 
              u.id as user_table_id, u.username, u.email
       FROM tb_reviews r 
       LEFT JOIN tb_users u ON r.userId = u.id 
       LIMIT 5`
    );
    
    // Buscar todos os usuários
    const [allUsers] = await db.query('SELECT id, username, email FROM tb_users ORDER BY id');
    
    console.log('=== ESTRUTURA DO BANCO ===');
    console.log('Estrutura tb_reviews:', reviewsStructure);
    console.log('Estrutura tb_users:', usersStructure);
    console.log('Avaliações de exemplo:', sampleReviews);
    console.log('Todos os usuários:', allUsers);
    console.log('==========================');
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        reviewsStructure,
        usersStructure,
        sampleReviews,
        allUsers,
        analysis: {
          reviewsUserIdType: reviewsStructure.find(col => col.Field === 'userId')?.Type,
          usersIdType: usersStructure.find(col => col.Field === 'id')?.Type,
          sampleDataTypes: sampleReviews.map(review => ({
            reviewId: review.id,
            reviewUserId: review.userId,
            reviewUserIdType: typeof review.userId,
            userTableId: review.user_table_id,
            userTableIdType: typeof review.user_table_id,
            username: review.username
          }))
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao verificar estrutura do banco:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 