'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './profile.module.css';

// Configuração para imagem padrão
const DEFAULT_AVATAR = '/default-avatar.svg';

export default function ProfilePage() {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [imagePreview, setImagePreview] = useState(DEFAULT_AVATAR);
  const [imageError, setImageError] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setNewUsername(session.user.name || '');
      setImagePreview(session.user.image || DEFAULT_AVATAR);
      setImageError(false);
    }
  }, [session]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleImageError = () => {
    setImageError(true);
    setImagePreview(DEFAULT_AVATAR);
  };

  const reloadSession = async (newData) => {
    try {
      // Força a atualização da sessão com os novos dados
      await update({
        ...session,
        user: {
          ...session.user,
          ...newData
        }
      });
      
      // Força a atualização do router para refletir as mudanças em toda a aplicação
      router.refresh();
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    clearMessages();

    // Validações do arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('A imagem deve ter no máximo 5MB');
      return;
    }

    // Preview da imagem
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageError(false);
    };
    reader.readAsDataURL(file);

    // Upload da imagem
    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      const res = await fetch('/api/user/update-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao atualizar imagem');
      }
      
      // Atualiza a sessão com a nova imagem
      await reloadSession({ image: data.imageUrl });
      
      // Força o recarregamento da página para atualizar a imagem em todos os componentes
      setTimeout(() => {
        router.refresh();
      }, 500);
      
      setSuccess('Imagem atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar imagem:', err);
      setError(err.message || 'Erro ao atualizar imagem. Tente novamente.');
      // Reverte o preview em caso de erro
      if (session?.user?.image) {
        setImagePreview(session.user.image);
      } else {
        setImagePreview(DEFAULT_AVATAR);
        setImageError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameUpdate = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!newUsername.trim()) {
      setError('O nome de usuário não pode estar vazio');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/update-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao atualizar nome');
      }

      // Atualiza a sessão com o novo nome
      await reloadSession({ name: newUsername });
      
      setSuccess('Nome atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar nome:', err);
      setError(err.message || 'Erro ao atualizar nome. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos os campos de senha são obrigatórios');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A nova senha e a confirmação não coincidem');
      return;
    }

    if (newPassword.length < 4) {
      setError('A nova senha deve ter pelo menos 4 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword,
          newPassword
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao atualizar senha');
      }

      setSuccess('Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      setError(err.message || 'Erro ao atualizar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <h1>Carregando...</h1>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className={styles.container}>
      <h1>Perfil</h1>
      
      <div className={styles.profileSection}>
        <div className={styles.imageSection}>
          <div className={styles.imageWrapper}>
            <div className={styles.imageContainer}>
              <Image
                src={imageError ? DEFAULT_AVATAR : imagePreview}
                alt="Foto de perfil"
                width={150}
                height={150}
                className={styles.profileImage}
                priority
                onError={handleImageError}
              />
              {loading && <div className={styles.imageLoading}>Carregando...</div>}
            </div>
            <label htmlFor="imageInput" className={`${styles.imageUploadLabel} ${loading ? styles.disabled : ''}`}>
              <span>{loading ? 'Carregando...' : 'Alterar foto'}</span>
              <input
                id="imageInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className={styles.imageInput}
                disabled={loading}
              />
            </label>
          </div>
        </div>

        <div className={styles.infoSection}>
          <form onSubmit={handleUsernameUpdate} className={styles.usernameForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">Nome de usuário</label>
              <input
                id="username"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className={styles.input}
                disabled={loading}
                placeholder="Seu nome de usuário"
              />
            </div>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Atualizando...' : 'Atualizar nome'}
            </button>
          </form>
          
          <div className={styles.userInfo}>
            <div className={styles.userDetail}>
              <strong>Email:</strong> {session.user.email}
            </div>
          </div>

          <div className={styles.passwordSection}>
            {!showPasswordForm ? (
              <button 
                className={styles.passwordToggleButton}
                onClick={() => setShowPasswordForm(true)}
                disabled={loading}
              >
                Alterar senha
              </button>
            ) : (
              <form onSubmit={handlePasswordUpdate} className={styles.passwordForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="currentPassword">Senha atual</label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={styles.input}
                    disabled={loading}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="newPassword">Nova senha</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.input}
                    disabled={loading}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="confirmPassword">Confirmar nova senha</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.input}
                    disabled={loading}
                    required
                  />
                </div>
                <div className={styles.passwordFormButtons}>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? 'Atualizando...' : 'Atualizar senha'}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
    </div>
  );
} 