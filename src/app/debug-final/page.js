'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function DebugFinal() {
  const { data: session, status } = useSession();
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/check-database-final');
      const data = await response.json();
      
      if (data.success) {
        setDebugData(data.data);
        console.log('Debug data:', data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  const testPermissionLogic = (reviewUserId, currentUserId) => {
    const currentUserIdNum = Number(currentUserId);
    const reviewUserIdNum = Number(reviewUserId);
    
    return {
      original: {
        currentUserId,
        reviewUserId,
        currentType: typeof currentUserId,
        reviewType: typeof reviewUserId,
        directMatch: currentUserId === reviewUserId
      },
      converted: {
        currentUserIdNum,
        reviewUserIdNum,
        currentType: typeof currentUserIdNum,
        reviewType: typeof reviewUserIdNum,
        numberMatch: currentUserIdNum === reviewUserIdNum
      },
      finalResult: currentUserIdNum === reviewUserIdNum
    };
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1e1e1e', minHeight: '100vh' }}>
        <h1>🔍 Debug Final - Resolução Definitiva</h1>
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1e1e1e', minHeight: '100vh' }}>
        <h1>🔍 Debug Final - Resolução Definitiva</h1>
        <div style={{ padding: '1rem', backgroundColor: '#4d0000', borderRadius: '8px' }}>
          <h2>❌ Erro</h2>
          <p>{error}</p>
          <button 
            onClick={fetchDebugData}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#e50914', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1e1e1e', minHeight: '100vh' }}>
      <h1>🔍 Debug Final - Resolução Definitiva</h1>
      
      {/* Sessão Atual */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Sessão Atual</h2>
        {session?.user ? (
          <div style={{ padding: '1rem', backgroundColor: '#004d00', borderRadius: '6px' }}>
            <p><strong>ID:</strong> {session.user.id} ({typeof session.user.id})</p>
            <p><strong>Nome:</strong> {session.user.name}</p>
            <p><strong>Email:</strong> {session.user.email}</p>
          </div>
        ) : (
          <div style={{ padding: '1rem', backgroundColor: '#4d0000', borderRadius: '6px' }}>
            <p>❌ Não logado</p>
          </div>
        )}
      </div>

      {/* Dados do Banco */}
      {debugData && (
        <>
          {/* Usuários */}
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h2>Usuários no Banco</h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {debugData.allUsers.map(user => (
                <div 
                  key={user.id}
                  style={{ 
                    padding: '0.5rem', 
                    backgroundColor: session?.user?.id == user.id ? '#004d00' : '#333',
                    borderRadius: '4px',
                    fontSize: '0.9em'
                  }}
                >
                  <strong>ID: {user.id}</strong> ({typeof user.id}) - {user.username} - {user.email}
                  {session?.user?.id == user.id && <span style={{ color: '#00ff00' }}> ← VOCÊ</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Avaliações */}
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h2>Avaliações no Banco (Filme 1232546)</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {debugData.allReviews.map(review => {
                const permissionTest = session?.user ? 
                  testPermissionLogic(review.userId, session.user.id) : null;
                
                return (
                  <div 
                    key={review.id}
                    style={{ 
                      padding: '1rem', 
                      backgroundColor: permissionTest?.finalResult ? '#004d00' : '#4d0000',
                      borderRadius: '6px',
                      border: `2px solid ${permissionTest?.finalResult ? '#00ff00' : '#ff0000'}`
                    }}
                  >
                    <h3>Review #{review.id}</h3>
                    <p><strong>Autor:</strong> {review.username} (ID: {review.userId}, tipo: {typeof review.userId})</p>
                    <p><strong>Nota:</strong> {review.rating}/10</p>
                    <p><strong>Conteúdo:</strong> {review.content.substring(0, 100)}...</p>
                    
                    {session?.user && permissionTest && (
                      <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#333', borderRadius: '4px' }}>
                        <h4>Teste de Permissão:</h4>
                        <p><strong>Resultado:</strong> 
                          <span style={{ color: permissionTest.finalResult ? '#00ff00' : '#ff0000' }}>
                            {permissionTest.finalResult ? ' ✅ PODE EDITAR' : ' ❌ NÃO PODE EDITAR'}
                          </span>
                        </p>
                        
                        <details style={{ marginTop: '0.5rem' }}>
                          <summary style={{ cursor: 'pointer', color: '#ccc' }}>Ver análise detalhada</summary>
                          <div style={{ marginTop: '0.5rem', fontSize: '0.8em', fontFamily: 'monospace' }}>
                            <p><strong>Dados Originais:</strong></p>
                            <p>• Current User ID: {permissionTest.original.currentUserId} ({permissionTest.original.currentType})</p>
                            <p>• Review User ID: {permissionTest.original.reviewUserId} ({permissionTest.original.reviewType})</p>
                            <p>• Match Direto: {permissionTest.original.directMatch ? 'SIM' : 'NÃO'}</p>
                            
                            <p style={{ marginTop: '0.5rem' }}><strong>Após Conversão:</strong></p>
                            <p>• Current User ID: {permissionTest.converted.currentUserIdNum} ({permissionTest.converted.currentType})</p>
                            <p>• Review User ID: {permissionTest.converted.reviewUserIdNum} ({permissionTest.converted.reviewType})</p>
                            <p>• Match Numérico: {permissionTest.converted.numberMatch ? 'SIM' : 'NÃO'}</p>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Análise de Tipos */}
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h2>Análise de Tipos de Dados</h2>
            <div style={{ padding: '1rem', backgroundColor: '#333', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.9em' }}>
              {debugData.typeAnalysis.map((analysis, index) => (
                <div key={index} style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#444', borderRadius: '4px' }}>
                  <p><strong>Review #{analysis.reviewId}</strong></p>
                  <p>• userId (review): {analysis.userId_from_review} ({analysis.userId_type})</p>
                  <p>• id (user table): {analysis.user_table_id} ({analysis.user_table_id_type})</p>
                  <p>• Username: {analysis.username}</p>
                  <p>• Match interno: {analysis.match_check ? 'SIM' : 'NÃO'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dados Específicos do Zezao */}
          {debugData.zezaoUser && (
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
              <h2>Dados Específicos do Zezao</h2>
              <div style={{ padding: '1rem', backgroundColor: '#333', borderRadius: '6px' }}>
                <p><strong>Usuário Zezao:</strong></p>
                <p>• ID: {debugData.zezaoUser.id} ({typeof debugData.zezaoUser.id})</p>
                <p>• Username: {debugData.zezaoUser.username}</p>
                <p>• Email: {debugData.zezaoUser.email}</p>
                
                <p style={{ marginTop: '1rem' }}><strong>Avaliações do Zezao:</strong></p>
                {debugData.zezaoReviews.length > 0 ? (
                  debugData.zezaoReviews.map(review => (
                    <div key={review.id} style={{ padding: '0.5rem', backgroundColor: '#444', borderRadius: '4px', marginTop: '0.5rem' }}>
                      <p>Review #{review.id} - Nota: {review.rating}/10</p>
                      <p>Conteúdo: {review.content.substring(0, 50)}...</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#ff6666' }}>❌ Nenhuma avaliação encontrada para o zezao no filme 1232546</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Controles */}
      <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Controles</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={fetchDebugData}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#e50914', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Atualizar Dados
          </button>
          
          <a 
            href="/reviews?movieId=1232546"
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#00cc00', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '4px',
              display: 'inline-block'
            }}
          >
            🎯 Ir para Reviews
          </a>
        </div>
        
        <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#4d4d00', borderRadius: '4px' }}>
          <strong>🎯 Objetivo:</strong> Identificar exatamente por que o zezao não consegue editar suas próprias avaliações
        </div>
      </div>
    </div>
  );
} 