'use client';
import { useState } from 'react';

export default function TestLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      console.log('Testando login com:', { email, password });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Resposta da API:', data);

      if (response.ok) {
        // Salvar usuário no localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        console.log('Dados salvos no localStorage:');
        console.log('User:', JSON.stringify(data.user, null, 2));
        console.log('Token:', data.token);
        
        setResult({
          success: true,
          message: 'Login realizado com sucesso!',
          user: data.user,
          token: data.token
        });
      } else {
        setResult({
          success: false,
          message: data.message || 'Erro no login',
          error: data
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setResult({
        success: false,
        message: 'Erro de conexão',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const clearStorage = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setResult(null);
    console.log('localStorage limpo');
  };

  const checkStorage = () => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('=== VERIFICAÇÃO DO LOCALSTORAGE ===');
    console.log('Raw user:', user);
    console.log('Raw token:', token);
    
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        console.log('Parsed user:', parsedUser);
        console.log('User ID type:', typeof parsedUser.id);
        console.log('User ID value:', parsedUser.id);
      } catch (error) {
        console.log('Erro ao parsear user:', error);
      }
    }
    console.log('================================');
  };

  return (
    <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1e1e1e', minHeight: '100vh' }}>
      <h1>Teste de Login</h1>
      
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Login</h2>
        <form onSubmit={testLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: 'none' }}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: 'none' }}
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#e50914', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Fazendo login...' : 'Login'}
          </button>
        </form>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Controles</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={checkStorage}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#666', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Verificar localStorage
          </button>
          <button 
            onClick={clearStorage}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#cc0000', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Limpar localStorage
          </button>
        </div>
      </div>

      {result && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
          <h2>Resultado do Login</h2>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: result.success ? '#004d00' : '#4d0000', 
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <strong>{result.success ? '✅ SUCESSO' : '❌ ERRO'}</strong>
            <p>{result.message}</p>
          </div>
          
          {result.success && result.user && (
            <div>
              <h3>Dados do Usuário:</h3>
              <pre style={{ fontSize: '0.8rem', color: '#ccc', backgroundColor: '#333', padding: '1rem', borderRadius: '4px' }}>
                {JSON.stringify(result.user, null, 2)}
              </pre>
              
              <h3>Análise:</h3>
              <ul style={{ fontSize: '0.9rem' }}>
                <li><strong>ID:</strong> {result.user.id} (tipo: {typeof result.user.id})</li>
                <li><strong>Username:</strong> {result.user.username}</li>
                <li><strong>Email:</strong> {result.user.email}</li>
              </ul>
            </div>
          )}
          
          {!result.success && (
            <div>
              <h3>Erro:</h3>
              <pre style={{ fontSize: '0.8rem', color: '#ff9999', backgroundColor: '#333', padding: '1rem', borderRadius: '4px' }}>
                {JSON.stringify(result.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Instruções</h2>
        <ol>
          <li>Teste o login com diferentes usuários (zezinho, zezao)</li>
          <li>Verifique os dados salvos no localStorage</li>
          <li>Observe os tipos de dados (especialmente o ID)</li>
          <li>Abra o console do navegador para ver logs detalhados</li>
          <li>Use "Verificar localStorage" para ver os dados atuais</li>
        </ol>
        
        <h3>Usuários de Teste:</h3>
        <ul>
          <li><strong>zezinho:</strong> zezinho@email.com / senha123</li>
          <li><strong>zezao:</strong> zezao@email.com / senha123</li>
        </ul>
      </div>
    </div>
  );
} 