'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DebugUser() {
  const [currentUser, setCurrentUser] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // Verificar usuário logado
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        setCurrentUser(parsedUser);
        console.log('Usuário atual:', parsedUser);
      } catch (error) {
        console.error('Erro ao parsear usuário:', error);
      }
    }

    // Buscar algumas avaliações para debug
    const fetchReviews = async () => {
      try {
        // Usar um movieId conhecido para buscar avaliações
        const response = await axios.get('/api/reviews?movieId=550'); // Fight Club
        if (response.data && response.data.reviews) {
          setReviews(response.data.reviews);
          console.log('Avaliações encontradas:', response.data.reviews);
        }
      } catch (error) {
        console.error('Erro ao buscar avaliações:', error);
      }
    };

    fetchReviews();
  }, []);

  const canEditReview = (review) => {
    if (!currentUser) {
      return false;
    }
    
    console.log('=== DEBUG PERMISSÃO ===');
    console.log('Current User:', {
      id: currentUser.id,
      username: currentUser.username,
      name: currentUser.name
    });
    console.log('Review:', {
      id: review.id,
      userId: review.userId,
      user_id: review.user_id,
      username: review.username
    });
    
    const checks = {
      'review.username === currentUser.username': review.username === currentUser.username,
      'review.username === currentUser.name': review.username === currentUser.name,
      'review.userId === currentUser.id': review.userId === currentUser.id,
      'review.user_id === currentUser.id': review.user_id === currentUser.id,
      'String(review.userId) === String(currentUser.id)': String(review.userId) === String(currentUser.id),
      'String(review.user_id) === String(currentUser.id)': String(review.user_id) === String(currentUser.id)
    };
    
    console.log('Verificações:', checks);
    
    const canEdit = Object.values(checks).some(check => check === true);
    console.log('Pode editar:', canEdit);
    console.log('======================');
    
    return canEdit;
  };

  return (
    <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1e1e1e', minHeight: '100vh' }}>
      <h1>Debug - Verificação de Usuário e Permissões</h1>
      
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Usuário Atual</h2>
        {currentUser ? (
          <pre style={{ color: '#00ff00' }}>
            {JSON.stringify(currentUser, null, 2)}
          </pre>
        ) : (
          <p style={{ color: '#ff0000' }}>Nenhum usuário logado</p>
        )}
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Avaliações Encontradas</h2>
        {reviews.length > 0 ? (
          reviews.map((review, index) => (
            <div key={review.id} style={{ 
              marginBottom: '1rem', 
              padding: '1rem', 
              backgroundColor: '#333', 
              borderRadius: '6px',
              border: canEditReview(review) ? '2px solid #00ff00' : '2px solid #ff0000'
            }}>
              <h3>Avaliação #{index + 1} {canEditReview(review) ? '(PODE EDITAR)' : '(NÃO PODE EDITAR)'}</h3>
              <pre style={{ fontSize: '0.9rem', color: '#ccc' }}>
                {JSON.stringify({
                  id: review.id,
                  userId: review.userId,
                  user_id: review.user_id,
                  username: review.username,
                  rating: review.rating,
                  content: review.content.substring(0, 100) + '...'
                }, null, 2)}
              </pre>
              <button 
                onClick={() => canEditReview(review)}
                style={{ 
                  padding: '0.5rem 1rem', 
                  backgroundColor: '#e50914', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Testar Permissão (veja o console)
              </button>
            </div>
          ))
        ) : (
          <p>Nenhuma avaliação encontrada</p>
        )}
      </div>

      <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Instruções</h2>
        <p>1. Abra o console do navegador (F12)</p>
        <p>2. Clique em "Testar Permissão" em qualquer avaliação</p>
        <p>3. Veja os logs detalhados no console</p>
        <p>4. Avaliações com borda verde = pode editar</p>
        <p>5. Avaliações com borda vermelha = não pode editar</p>
      </div>
    </div>
  );
} 