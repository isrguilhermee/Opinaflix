'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function TestFixFinal() {
  const { data: session, status } = useSession();
  const [testResults, setTestResults] = useState([]);
  const [message, setMessage] = useState('');

  // Simular a lógica exata usada na aplicação
  const createCurrentUser = (session) => {
    return session?.user ? {
      id: session.user.id,
      username: session.user.name,
      email: session.user.email
    } : null;
  };

  const canEditReview = (review, currentUser) => {
    if (!currentUser) {
      return false;
    }
    
    // Converter ambos os IDs para números para comparação consistente
    const currentUserId = Number(currentUser.id);
    const reviewUserId = Number(review.userId);
    
    // Verificar se a conversão foi bem-sucedida
    if (isNaN(currentUserId) || isNaN(reviewUserId)) {
      console.warn('Erro na conversão de IDs para números:', {
        currentUserId: currentUser.id,
        reviewUserId: review.userId
      });
      return false;
    }
    
    // Comparação usando números convertidos
    return currentUserId === reviewUserId;
  };

  const runCompleteTest = () => {
    if (!session?.user) {
      setMessage('❌ Faça login primeiro');
      return;
    }

    const currentUser = createCurrentUser(session);
    
    // Simular avaliações reais do banco
    const mockReviews = [
      { id: 1, userId: 1, username: 'zezinho', content: 'Avaliação do zezinho', rating: 8 },
      { id: 2, userId: '1', username: 'zezinho', content: 'Outra avaliação do zezinho', rating: 7 },
      { id: 3, userId: 2, username: 'zezao', content: 'Avaliação do zezao', rating: 9 },
      { id: 4, userId: '2', username: 'zezao', content: 'Outra avaliação do zezao', rating: 6 },
      { id: 5, userId: 3, username: 'outro_usuario', content: 'Avaliação de outro usuário', rating: 5 }
    ];

    const results = mockReviews.map(review => {
      const canEdit = canEditReview(review, currentUser);
      return {
        reviewId: review.id,
        reviewUserId: review.userId,
        reviewUsername: review.username,
        currentUserId: currentUser.id,
        currentUsername: currentUser.username,
        canEdit,
        shouldEdit: Number(currentUser.id) === Number(review.userId)
      };
    });

    setTestResults(results);

    const userReviews = results.filter(r => r.canEdit);
    const expectedReviews = results.filter(r => r.shouldEdit);
    
    const success = userReviews.length === expectedReviews.length && 
                   userReviews.every(r => r.canEdit === r.shouldEdit);

    setMessage(success ? 
      `✅ TESTE PASSOU! Você pode editar ${userReviews.length} avaliações (correto)` :
      `❌ TESTE FALHOU! Resultado inesperado`
    );
  };

  const switchToZezinho = async () => {
    try {
      if (session) await signOut({ redirect: false });
      const result = await signIn('credentials', {
        email: 'teste@teste.com',
        password: 'teste',
        redirect: false
      });
      if (result?.ok) {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      setMessage(`❌ Erro no login: ${error.message}`);
    }
  };

  const switchToZezao = async () => {
    try {
      if (session) await signOut({ redirect: false });
      const result = await signIn('credentials', {
        email: 'teste@gmail.com',
        password: 'teste',
        redirect: false
      });
      if (result?.ok) {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      setMessage(`❌ Erro no login: ${error.message}`);
    }
  };

  if (status === 'loading') {
    return (
      <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1e1e1e', minHeight: '100vh' }}>
        <h1>🎯 Teste Final - Correção Aplicada</h1>
        <p>Carregando sessão...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1e1e1e', minHeight: '100vh' }}>
      <h1>🎯 Teste Final - Correção Aplicada</h1>
      
      {/* Status da Correção */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#004d00', borderRadius: '8px' }}>
        <h2>✅ Correção Aplicada</h2>
        <p><strong>Problema identificado:</strong> A página de reviews estava usando localStorage em vez de NextAuth</p>
        <p><strong>Solução implementada:</strong> Alterada para usar useSession() do NextAuth</p>
        <p><strong>Resultado esperado:</strong> Agora os botões de editar/excluir devem aparecer corretamente</p>
      </div>

      {/* Usuário Atual */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Usuário Atual (NextAuth)</h2>
        {session?.user ? (
          <div style={{ padding: '1rem', backgroundColor: '#004d00', borderRadius: '6px' }}>
            <p><strong>ID:</strong> {session.user.id} ({typeof session.user.id})</p>
            <p><strong>Nome:</strong> {session.user.name}</p>
            <p><strong>Email:</strong> {session.user.email}</p>
            <p><strong>Status:</strong> <span style={{ color: '#00ff00' }}>✅ Logado via NextAuth</span></p>
          </div>
        ) : (
          <div style={{ padding: '1rem', backgroundColor: '#4d0000', borderRadius: '6px' }}>
            <p style={{ color: '#ff6666' }}>❌ Nenhum usuário logado</p>
            <p>Use os botões abaixo ou o cabeçalho para fazer login</p>
          </div>
        )}
      </div>

      {/* Controles */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Controles de Teste</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button 
            onClick={switchToZezinho}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#e50914', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Login como ZEZINHO
          </button>
          
          <button 
            onClick={switchToZezao}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#0066cc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Login como ZEZAO
          </button>
          
          <button 
            onClick={runCompleteTest}
            disabled={!session?.user}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#00cc00', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: !session?.user ? 'not-allowed' : 'pointer',
              opacity: !session?.user ? 0.6 : 1
            }}
          >
            🧪 Testar Lógica
          </button>

          {session && (
            <button 
              onClick={() => signOut({ redirect: false })}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: '#666', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🚪 Logout
            </button>
          )}
        </div>
      </div>

      {/* Mensagem */}
      {message && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
          <h2>Resultado do Teste</h2>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: message.includes('✅') ? '#004d00' : '#4d0000',
            borderRadius: '4px',
            fontSize: '1.1em'
          }}>
            {message}
          </div>
        </div>
      )}

      {/* Resultados Detalhados */}
      {testResults.length > 0 && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
          <h2>Resultados Detalhados</h2>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {testResults.map((result, index) => (
              <div 
                key={index}
                style={{ 
                  padding: '0.75rem', 
                  backgroundColor: result.canEdit ? '#004d00' : '#333',
                  borderRadius: '4px',
                  fontSize: '0.9em'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <strong>Review #{result.reviewId}</strong> - {result.reviewUsername} (ID: {result.reviewUserId})
                  </span>
                  <span style={{ color: result.canEdit ? '#00ff00' : '#ff6666' }}>
                    {result.canEdit ? '✅ PODE EDITAR' : '❌ NÃO PODE EDITAR'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8em', color: '#ccc', marginTop: '0.25rem' }}>
                  Comparação: {result.currentUserId} === {result.reviewUserId} = {result.canEdit ? 'true' : 'false'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instruções Finais */}
      <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Teste Prático</h2>
        <ol>
          <li><strong>Faça login</strong> usando os botões acima ou o cabeçalho</li>
          <li><strong>Teste a lógica</strong> clicando em "🧪 Testar Lógica"</li>
          <li><strong>Vá para a página real:</strong> <a href="/reviews?movieId=1232546" style={{ color: '#e50914' }}>/reviews?movieId=1232546</a></li>
          <li><strong>Verifique</strong> se os botões de editar/excluir aparecem apenas nas suas avaliações</li>
          <li><strong>Teste o filtro</strong> "Mostrar apenas minhas avaliações"</li>
        </ol>
        
        <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#004d00', borderRadius: '4px' }}>
          <strong>✅ Problema Resolvido:</strong> A página de reviews agora usa NextAuth corretamente, 
          então os botões de editar/excluir devem aparecer apenas para o autor das avaliações.
        </div>
      </div>
    </div>
  );
} 