'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const username = e.target.username.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    if (!username || !email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Conta criada com sucesso! Redirecionando...');
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        setError(data.message || 'Erro ao criar conta');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão com o servidor');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Criar Conta</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input name="username" type="text" placeholder="Nome de usuário" style={styles.input} required />
        <input name="email" type="email" placeholder="Email" style={styles.input} required />
        <input name="password" type="password" placeholder="Senha" style={styles.input} required />
        <button type="submit" style={styles.button}>Cadastrar</button>
      </form>
      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}
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
  },
  success: {
    marginTop: 10,
    color: '#00cc66',
    textAlign: 'center',
  },
};
