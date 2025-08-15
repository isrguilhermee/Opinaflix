'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res.ok) {
        router.push('/');
        router.refresh(); // Força a atualização dos componentes para refletir o novo estado de autenticação
      } else {
        setError('Email ou senha incorretos');
      }
    } catch (error) {
      setError('Ocorreu um erro ao tentar fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Entrar</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input 
          name="email" 
          type="email" 
          placeholder="Email" 
          style={styles.input} 
          required 
          disabled={loading}
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Senha" 
          style={styles.input} 
          required 
          disabled={loading}
        />
        <button 
          type="submit" 
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 400,
    margin: '60px auto',
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#1e1e1e',
    color: '#fff',
    boxShadow: '0 0 10px rgba(0,0,0,0.3)'
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
  },
  input: {
    padding: 10,
    borderRadius: 6,
    border: '1px solid #555',
    backgroundColor: '#2c2c2c',
    color: '#fff',
  },
  button: {
    padding: 10,
    backgroundColor: '#e50914',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  error: {
    marginTop: 10,
    color: '#ff4d4d',
    textAlign: 'center',
  }
};
