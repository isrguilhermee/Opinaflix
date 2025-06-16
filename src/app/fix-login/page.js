'use client';
import { useState, useEffect } from 'react';

export default function FixLogin() {
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState('');
  const [usersData, setUsersData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verificar usuário atual
        const user = localStorage.getItem('user');
        if (user) {
          try {
            const parsedUser = JSON.parse(user);
            setCurrentUser(parsedUser);
          } catch (error) {
            console.error('Erro ao parsear usuário:', error);
          }
        }

        // Buscar dados dos usuários do banco
        const response = await fetch('/api/debug/check-users');
        const data = await response.json();
        if (data.success) {
          setUsersData(data.data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const testLogin = async (email, password, username) => {
    try {
      setMessage(`Testando ${username} com ${email} e senha "${password}"...`);
      
      const response = await fetch('/api/auth/test-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log(`Teste de login ${username} (${email}):`, data);

      if (response.ok && data.user) {
        return { success: true, user: data.user, token: data.token };
      } else {
        return { success: false, error: data.message, debug: data.debug };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const smartLogin = async (targetUsername) => {
    setMessage(`Procurando usuário ${targetUsername} no banco...`);
    
    if (!usersData) {
      setMessage('❌ Dados dos usuários não carregados');
      return;
    }

    // Verificar se o usuário existe no banco
    const userInDb = usersData.allUsers.find(u => u.username === targetUsername);
    
    if (!userInDb) {
      setMessage(`❌ Usuário "${targetUsername}" não encontrado no banco de dados`);
      return;
    }

    setMessage(`✅ Usuário encontrado! Email: ${userInDb.email}. Testando senhas...`);

    // Lista de senhas para testar
    const passwordsToTry = [
      'teste',
      'senha123',
      '123456',
      'password',
      'admin',
      targetUsername,
      targetUsername + '123',
      'teste123',
      '12345678'
    ];

    // Tentar login com o email correto e diferentes senhas
    for (const password of passwordsToTry) {
      const result = await testLogin(userInDb.email, password, targetUsername);
      
      if (result.success) {
        // Limpar localStorage e salvar dados corretos
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', result.token);
        
        setCurrentUser(result.user);
        setMessage(`✅ Login realizado com sucesso! 
        Email: ${userInDb.email}
        Senha: ${password}
        Logado como: ${result.user.username} (ID: ${result.user.id})`);
        
        // Recarregar a página após 3 segundos
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        return;
      } else {
        console.log(`Falha com senha "${password}":`, result.error);
      }
    }
    
    setMessage(`❌ Não foi possível fazer login como ${targetUsername}. 
    Email testado: ${userInDb.email}
    Senhas testadas: ${passwordsToTry.join(', ')}
    
    Possível problema: senha no banco pode estar em formato diferente ou usuário pode não ter senha definida.`);
  };

  const createTestUser = async () => {
    try {
      setMessage('Criando usuário de teste...');
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'teste',
          email: 'teste@teste.com',
          password: 'senha123'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('✅ Usuário de teste criado! Fazendo login...');
        
        // Fazer login com o usuário recém-criado
        const loginResult = await testLogin('teste@teste.com', 'senha123', 'teste');
        
        if (loginResult.success) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          
          localStorage.setItem('user', JSON.stringify(loginResult.user));
          localStorage.setItem('token', loginResult.token);
          
          setCurrentUser(loginResult.user);
          setMessage(`✅ Login realizado com usuário de teste! Logado como: ${loginResult.user.username}`);
          
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } else {
        setMessage(`❌ Erro ao criar usuário: ${data.message}`);
      }
    } catch (error) {
      setMessage(`❌ Erro: ${error.message}`);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    setMessage('✅ Logout realizado. localStorage limpo.');
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const quickFix = async (targetUsername) => {
    setMessage(`Correção rápida: fazendo login como ${targetUsername} com senha "teste"...`);
    
    if (!usersData) {
      setMessage('❌ Dados dos usuários não carregados');
      return;
    }

    const userInDb = usersData.allUsers.find(u => u.username === targetUsername);
    
    if (!userInDb) {
      setMessage(`❌ Usuário "${targetUsername}" não encontrado no banco de dados`);
      return;
    }

    // Tentar login direto com senha "teste"
    const result = await testLogin(userInDb.email, 'teste', targetUsername);
    
    if (result.success) {
      // Limpar localStorage e salvar dados corretos
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('token', result.token);
      
      setCurrentUser(result.user);
      setMessage(`✅ CORREÇÃO REALIZADA COM SUCESSO! 
      Email: ${userInDb.email}
      Senha: teste
      Logado como: ${result.user.username} (ID: ${result.user.id})
      
      Redirecionando em 3 segundos...`);
      
      // Recarregar a página após 3 segundos
      setTimeout(() => {
        window.location.href = '/debug-complete';
      }, 3000);
    } else {
      setMessage(`❌ Erro na correção rápida: ${result.error}
      
      Tentando método completo...`);
      
      // Se falhar, usar o método completo
      smartLogin(targetUsername);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1e1e1e' }}>Carregando dados dos usuários...</div>;
  }

  return (
    <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1e1e1e', minHeight: '100vh' }}>
      <h1>🔧 Correção de Login</h1>
      
      {/* Status Atual */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Status Atual</h2>
        {currentUser ? (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#333', 
            borderRadius: '6px',
            border: '2px solid #ff9900'
          }}>
            <h3>⚠️ Usuário Logado (localStorage)</h3>
            <ul>
              <li><strong>ID:</strong> {currentUser.id} ({typeof currentUser.id})</li>
              <li><strong>Username:</strong> {currentUser.username}</li>
              <li><strong>Email:</strong> {currentUser.email}</li>
            </ul>
            
            <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#4d4d00', borderRadius: '4px' }}>
              <strong>⚠️ PROBLEMA DETECTADO:</strong><br/>
              Você está logado como "{currentUser.username}" mas o cabeçalho mostra "zezinho".<br/>
              Isso causa conflitos nas permissões e filtros.
            </div>
          </div>
        ) : (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#333', 
            borderRadius: '6px',
            border: '2px solid #ff0000'
          }}>
            <h3>❌ Nenhum usuário logado</h3>
            <p>localStorage está vazio.</p>
          </div>
        )}
      </div>

      {/* Usuários Disponíveis */}
      {usersData && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
          <h2>Usuários Disponíveis no Banco</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {usersData.allUsers.map((user) => (
              <div key={user.id} style={{ 
                padding: '1rem', 
                backgroundColor: '#333', 
                borderRadius: '6px',
                border: '1px solid #555'
              }}>
                <h3>#{user.id} - {user.username}</h3>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Criado em:</strong> {new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                
                <button 
                  onClick={() => smartLogin(user.username)}
                  style={{ 
                    marginTop: '0.5rem',
                    padding: '0.5rem 1rem', 
                    backgroundColor: '#e50914', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  🔧 Tentar Login como {user.username}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ações de Correção */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Ações de Correção</h2>
        <div style={{ display: 'grid', gap: '1rem', maxWidth: '600px' }}>
          
          <button 
            onClick={() => quickFix('zezinho')}
            style={{ 
              padding: '1.5rem', 
              backgroundColor: '#00cc00', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            ⚡ CORREÇÃO RÁPIDA: Login como ZEZINHO (senha: teste)
          </button>
          
          <button 
            onClick={() => quickFix('zezinho')}
            style={{ 
              padding: '1rem', 
              backgroundColor: '#e50914', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🔧 CORRIGIR: Login como ZEZINHO (teste@teste.com)
          </button>
          
          <button 
            onClick={() => quickFix('zezao')}
            style={{ 
              padding: '1rem', 
              backgroundColor: '#0066cc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            👤 Trocar para ZEZAO (teste@gmail.com)
          </button>
          
          <button 
            onClick={createTestUser}
            style={{ 
              padding: '1rem', 
              backgroundColor: '#009900', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            ➕ Criar Usuário de Teste
          </button>
          
          <button 
            onClick={logout}
            style={{ 
              padding: '1rem', 
              backgroundColor: '#666', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🚪 Fazer Logout Completo
          </button>
        </div>
      </div>

      {/* Mensagem de Status */}
      {message && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
          <h2>Status da Operação</h2>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: message.includes('✅') ? '#004d00' : message.includes('❌') ? '#4d0000' : '#4d4d00',
            borderRadius: '4px',
            whiteSpace: 'pre-line'
          }}>
            {message}
          </div>
        </div>
      )}

      {/* Instruções */}
      <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Instruções</h2>
        <ol>
          <li><strong>RECOMENDADO:</strong> Clique em "⚡ CORREÇÃO RÁPIDA" (usa senha "teste" diretamente)</li>
          <li><strong>Alternativa:</strong> Clique em "🔧 CORRIGIR: Login como ZEZINHO"</li>
          <li><strong>Para testar outro usuário:</strong> Clique em "👤 Trocar para ZEZAO"</li>
          <li><strong>Se nada funcionar:</strong> Clique em "➕ Criar Usuário de Teste"</li>
          <li><strong>Para limpar tudo:</strong> Clique em "🚪 Fazer Logout Completo"</li>
          <li>Após a correção, você será redirecionado para <a href="/debug-complete" style={{ color: '#e50914' }}>/debug-complete</a></li>
        </ol>
        
        <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#333', borderRadius: '4px' }}>
          <strong>🎯 Correção Rápida:</strong> Agora que sabemos que a senha é "teste", o botão verde faz login direto sem testar outras senhas.
        </div>
      </div>
    </div>
  );
} 