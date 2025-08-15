'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DebugComplete() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [databaseInfo, setDatabaseInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
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
        const [usersResponse, reviewsResponse, dbResponse] = await Promise.all([
          axios.get('/api/debug/users'),
          axios.get('/api/reviews?movieId=550'),
          axios.get('/api/debug/database')
        ]);

        if (usersResponse.data && usersResponse.data.users) {
          setUsers(usersResponse.data.users);
        }

        if (reviewsResponse.data && reviewsResponse.data.reviews) {
          setReviews(reviewsResponse.data.reviews);
        }

        if (dbResponse.data && dbResponse.data.data) {
          setDatabaseInfo(dbResponse.data.data);
        }

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const testPermissions = (review) => {
    if (!currentUser) return false;
    
    const checks = [
      review.userId === currentUser.id,
      String(review.userId) === String(currentUser.id),
      Number(review.userId) === Number(currentUser.id)
    ];
    
    return checks.some(check => check === true);
  };

  const testFilter = () => {
    if (!currentUser) return [];
    
    return reviews.filter(review => {
      const isUserReview = 
        review.userId === currentUser.id ||
        String(review.userId) === String(currentUser.id) ||
        Number(review.userId) === Number(currentUser.id);
      
      return isUserReview;
    });
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1e1e1e' }}>Carregando dados completos...</div>;
  }

  const userReviews = testFilter();

  return (
    <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1e1e1e', minHeight: '100vh' }}>
      <h1>Debug Completo - Diagnóstico de Problemas</h1>
      
      {/* Status Geral */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Status Geral</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#333', borderRadius: '6px' }}>
            <h3>Usuário Logado</h3>
            <p style={{ color: currentUser ? '#00ff00' : '#ff0000' }}>
              {currentUser ? '✅ SIM' : '❌ NÃO'}
            </p>
            {currentUser && (
              <small>ID: {currentUser.id} ({typeof currentUser.id})</small>
            )}
          </div>
          
          <div style={{ padding: '1rem', backgroundColor: '#333', borderRadius: '6px' }}>
            <h3>Filtro "Minhas Avaliações"</h3>
            <p style={{ color: userReviews.length > 0 ? '#00ff00' : '#ff0000' }}>
              {userReviews.length > 0 ? '✅ FUNCIONA' : '❌ NÃO FUNCIONA'}
            </p>
            <small>{userReviews.length} de {reviews.length} avaliações</small>
          </div>
          
          <div style={{ padding: '1rem', backgroundColor: '#333', borderRadius: '6px' }}>
            <h3>Permissões de Edição</h3>
            <p style={{ color: reviews.some(r => testPermissions(r)) ? '#00ff00' : '#ff0000' }}>
              {reviews.some(r => testPermissions(r)) ? '✅ FUNCIONA' : '❌ NÃO FUNCIONA'}
            </p>
            <small>{reviews.filter(r => testPermissions(r)).length} editáveis</small>
          </div>
        </div>
      </div>

      {/* Usuário Atual */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Usuário Atual (localStorage)</h2>
        {currentUser ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <h3>Dados Brutos:</h3>
              <pre style={{ fontSize: '0.8rem', color: '#ccc', backgroundColor: '#333', padding: '1rem', borderRadius: '4px' }}>
                {JSON.stringify(currentUser, null, 2)}
              </pre>
            </div>
            <div>
              <h3>Análise:</h3>
              <ul style={{ fontSize: '0.9rem' }}>
                <li><strong>ID:</strong> {currentUser.id}</li>
                <li><strong>Tipo do ID:</strong> {typeof currentUser.id}</li>
                <li><strong>Username:</strong> {currentUser.username}</li>
                <li><strong>Email:</strong> {currentUser.email}</li>
                <li><strong>ID como Number:</strong> {Number(currentUser.id)}</li>
                <li><strong>ID como String:</strong> "{String(currentUser.id)}"</li>
              </ul>
            </div>
          </div>
        ) : (
          <p style={{ color: '#ff0000' }}>Nenhum usuário logado - <a href="/test-login" style={{ color: '#e50914' }}>Fazer login</a></p>
        )}
      </div>

      {/* Comparação de Usuários */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Usuários no Banco vs localStorage</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {users.map((user) => {
            const isCurrentUser = currentUser && (
              user.id === currentUser.id ||
              String(user.id) === String(currentUser.id) ||
              Number(user.id) === Number(currentUser.id)
            );
            
            return (
              <div key={user.id} style={{ 
                padding: '1rem', 
                backgroundColor: '#333', 
                borderRadius: '6px',
                border: isCurrentUser ? '2px solid #00ff00' : '1px solid #555'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <h3>Usuário #{user.id} {isCurrentUser ? '(ATUAL)' : ''}</h3>
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                  </div>
                  
                  <div>
                    <h4>Dados Técnicos:</h4>
                    <ul style={{ fontSize: '0.8rem' }}>
                      <li>ID: {user.id} ({typeof user.id})</li>
                      <li>Como Number: {Number(user.id)}</li>
                      <li>Como String: "{String(user.id)}"</li>
                    </ul>
                  </div>
                  
                  {currentUser && (
                    <div>
                      <h4>Comparação:</h4>
                      <ul style={{ fontSize: '0.8rem' }}>
                        <li>ID === currentUser.id: {String(user.id === currentUser.id)}</li>
                        <li>String(ID) === String(currentUser.id): {String(String(user.id) === String(currentUser.id))}</li>
                        <li>Number(ID) === Number(currentUser.id): {String(Number(user.id) === Number(currentUser.id))}</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Avaliações e Permissões */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Avaliações e Permissões</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {reviews.map((review) => {
            const canEdit = testPermissions(review);
            const isInFilter = userReviews.some(ur => ur.id === review.id);
            
            return (
              <div key={review.id} style={{ 
                padding: '1rem', 
                backgroundColor: '#333', 
                borderRadius: '6px',
                border: canEdit ? '2px solid #00ff00' : '1px solid #555'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <h3>Avaliação #{review.id}</h3>
                    <p><strong>Autor:</strong> {review.username}</p>
                    <p><strong>Nota:</strong> {review.rating}/10</p>
                    <p><strong>Filme:</strong> {review.movieTitle}</p>
                  </div>
                  
                  <div>
                    <h4>Dados Técnicos:</h4>
                    <ul style={{ fontSize: '0.8rem' }}>
                      <li>userId: {review.userId} ({typeof review.userId})</li>
                      <li>Como Number: {Number(review.userId)}</li>
                      <li>Como String: "{String(review.userId)}"</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4>Status:</h4>
                    <ul style={{ fontSize: '0.8rem' }}>
                      <li style={{ color: canEdit ? '#00ff00' : '#ff0000' }}>
                        Pode editar: {canEdit ? '✅ SIM' : '❌ NÃO'}
                      </li>
                      <li style={{ color: isInFilter ? '#00ff00' : '#ff0000' }}>
                        No filtro: {isInFilter ? '✅ SIM' : '❌ NÃO'}
                      </li>
                    </ul>
                    
                    {currentUser && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <h5>Comparações:</h5>
                        <ul style={{ fontSize: '0.7rem' }}>
                          <li>userId === currentUser.id: {String(review.userId === currentUser.id)}</li>
                          <li>String(userId) === String(currentUser.id): {String(String(review.userId) === String(currentUser.id))}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estrutura do Banco */}
      {databaseInfo && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
          <h2>Estrutura do Banco de Dados</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <h3>Tabela tb_users:</h3>
              <pre style={{ fontSize: '0.7rem', color: '#ccc', backgroundColor: '#333', padding: '1rem', borderRadius: '4px' }}>
                {JSON.stringify(databaseInfo.usersStructure, null, 2)}
              </pre>
            </div>
            <div>
              <h3>Tabela tb_reviews:</h3>
              <pre style={{ fontSize: '0.7rem', color: '#ccc', backgroundColor: '#333', padding: '1rem', borderRadius: '4px' }}>
                {JSON.stringify(databaseInfo.reviewsStructure, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Instruções */}
      <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Instruções para Diagnóstico</h2>
        <ol>
          <li>Verifique o "Status Geral" no topo</li>
          <li>Se não estiver logado, vá para <a href="/test-login" style={{ color: '#e50914' }}>/test-login</a></li>
          <li>Observe os tipos de dados (number vs string) nas comparações</li>
          <li>Verifique se as avaliações com borda verde são realmente suas</li>
          <li>Abra o console do navegador para logs detalhados</li>
        </ol>
      </div>
    </div>
  );
} 