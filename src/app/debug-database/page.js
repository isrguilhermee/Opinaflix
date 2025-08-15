'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DebugDatabase() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar usuário logado
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        setCurrentUser(parsedUser);
        console.log('Usuário atual do localStorage:', parsedUser);
      } catch (error) {
        console.error('Erro ao parsear usuário:', error);
      }
    }

    // Buscar dados do banco
    const fetchData = async () => {
      try {
        // Buscar usuários
        const usersResponse = await axios.get('/api/debug/users');
        if (usersResponse.data && usersResponse.data.users) {
          setUsers(usersResponse.data.users);
        }

        // Buscar avaliações
        const reviewsResponse = await axios.get('/api/reviews?movieId=550');
        if (reviewsResponse.data && reviewsResponse.data.reviews) {
          setReviews(reviewsResponse.data.reviews);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const compareIds = (id1, id2) => {
    const results = {
      'strict (===)': id1 === id2,
      'loose (==)': id1 == id2,
      'string comparison': String(id1) === String(id2),
      'number comparison': Number(id1) === Number(id2)
    };
    return results;
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1e1e1e' }}>Carregando...</div>;
  }

  return (
    <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1e1e1e', minHeight: '100vh' }}>
      <h1>Debug - Dados do Banco de Dados</h1>
      
      {/* Usuário Atual */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Usuário Atual (localStorage)</h2>
        {currentUser ? (
          <div>
            <pre style={{ color: '#00ff00', fontSize: '0.9rem' }}>
              {JSON.stringify(currentUser, null, 2)}
            </pre>
            <div style={{ marginTop: '1rem' }}>
              <strong>ID:</strong> {currentUser.id} (tipo: {typeof currentUser.id})<br/>
              <strong>Username:</strong> {currentUser.username}<br/>
              <strong>Email:</strong> {currentUser.email}
            </div>
          </div>
        ) : (
          <p style={{ color: '#ff0000' }}>Nenhum usuário logado</p>
        )}
      </div>

      {/* Usuários do Banco */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Usuários no Banco de Dados</h2>
        {users.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {users.map((user, index) => (
              <div key={user.id} style={{ 
                padding: '1rem', 
                backgroundColor: '#333', 
                borderRadius: '6px',
                border: currentUser && user.id === currentUser.id ? '2px solid #00ff00' : '1px solid #555'
              }}>
                <h3>Usuário #{user.id} {currentUser && user.id === currentUser.id ? '(ATUAL)' : ''}</h3>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <div style={{ fontSize: '0.8rem', color: '#ccc', marginTop: '0.5rem' }}>
                  <strong>Dados técnicos:</strong><br/>
                  ID: {user.id} (tipo: {typeof user.id})<br/>
                  Created: {user.created_at}
                </div>
                
                {currentUser && (
                  <div style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                    <strong>Comparação com usuário atual:</strong>
                    <pre style={{ fontSize: '0.7rem', color: '#ccc' }}>
                      {JSON.stringify(compareIds(user.id, currentUser.id), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>Nenhum usuário encontrado</p>
        )}
      </div>

      {/* Avaliações do Banco */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Avaliações no Banco de Dados</h2>
        {reviews.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {reviews.map((review, index) => {
              const isCurrentUserReview = currentUser && (
                review.userId === currentUser.id ||
                String(review.userId) === String(currentUser.id)
              );
              
              return (
                <div key={review.id} style={{ 
                  padding: '1rem', 
                  backgroundColor: '#333', 
                  borderRadius: '6px',
                  border: isCurrentUserReview ? '2px solid #00ff00' : '1px solid #555'
                }}>
                  <h3>Avaliação #{review.id} - Nota: {review.rating}/10 {isCurrentUserReview ? '(MINHA)' : ''}</h3>
                  <p><strong>Autor:</strong> {review.username}</p>
                  <p><strong>Conteúdo:</strong> {review.content.substring(0, 100)}...</p>
                  
                  <div style={{ fontSize: '0.8rem', color: '#ccc', marginTop: '0.5rem' }}>
                    <strong>Dados técnicos:</strong><br/>
                    userId: {review.userId} (tipo: {typeof review.userId})<br/>
                    username: {review.username}<br/>
                    created_at: {review.created_at}
                  </div>
                  
                  {currentUser && (
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                      <strong>Comparação com usuário atual:</strong>
                      <pre style={{ fontSize: '0.7rem', color: '#ccc' }}>
                        {JSON.stringify(compareIds(review.userId, currentUser.id), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p>Nenhuma avaliação encontrada</p>
        )}
      </div>

      {/* Análise de Problemas */}
      <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Análise de Problemas</h2>
        {currentUser ? (
          <div>
            <h3>Filtro "Minhas Avaliações":</h3>
            <p>Avaliações que deveriam aparecer: {reviews.filter(r => 
              r.userId === currentUser.id || String(r.userId) === String(currentUser.id)
            ).length}</p>
            
            <h3>Permissões de Edição:</h3>
            <p>Avaliações que posso editar: {reviews.filter(r => 
              r.userId === currentUser.id || String(r.userId) === String(currentUser.id)
            ).length}</p>
            
            <h3>Possíveis Problemas:</h3>
            <ul>
              <li>Tipo de dados diferentes (number vs string)</li>
              <li>IDs não correspondentes</li>
              <li>Dados corrompidos no localStorage</li>
              <li>Problema na query SQL</li>
            </ul>
          </div>
        ) : (
          <p>Faça login para ver a análise</p>
        )}
      </div>
    </div>
  );
} 