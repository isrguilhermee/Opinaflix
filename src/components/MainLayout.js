'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from '../styles/Layout.module.css';
import { useSession, signOut } from 'next-auth/react';

// Configuração para imagem padrão com tratamento de erro
const DEFAULT_AVATAR = '/default-avatar.svg';

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(DEFAULT_AVATAR);
  const [isAdmin, setIsAdmin] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  // Atualizar a imagem quando a sessão mudar
  useEffect(() => {
    if (session?.user?.image) {
      console.log('Imagem na sessão:', session.user.image);
      setImageSrc(session.user.image);
      setImageError(false);
    } else {
      setImageSrc(DEFAULT_AVATAR);
    }
  }, [session]);

  // Verificar se o usuário é admin
  useEffect(() => {
    if (session) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [session]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/user/check-admin');
      const result = await response.json();
      setIsAdmin(result.success && result.isAdmin);
    } catch (error) {
      console.error('Erro ao verificar status de admin:', error);
      setIsAdmin(false);
    }
  };

  // Função para lidar com erros de carregamento de imagem
  const handleImageError = () => {
    console.log('Erro ao carregar imagem no layout, usando padrão');
    setImageError(true);
    setImageSrc(DEFAULT_AVATAR);
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.navbarContent}>
          <div className={styles.logo}>
            <Link href="/">Opinaflix</Link>
          </div>
          
          <button 
            className={styles.menuButton}
            onClick={toggleMenu}
            aria-label="Menu"
          >
            <span className={styles.menuIcon}></span>
          </button>

          <div className={`${styles.navLinks} ${isMenuOpen ? styles.active : ''} ${!isAdmin ? styles.noAdmin : ''}`}>
            <Link href="/" className={pathname === '/' ? styles.active : ''}>
              Início
            </Link>
            <Link href="/search" className={pathname === '/search' ? styles.active : ''}>
              Buscar
            </Link>
            {session && isAdmin && (
              <Link href="/admin/dashboard" className={pathname === '/admin/dashboard' ? styles.active : ''}>
                Dashboard
              </Link>
            )}
          </div>

          <div className={`${styles.authButtons} ${isMenuOpen ? styles.active : ''}`}>
            {session ? (
              <>
                <Link href="/profile" className={styles.profileLink}>
                  <div className={styles.profileInfo}>
                    <Image
                      src={imageSrc}
                      alt="Foto de perfil"
                      width={32}
                      height={32}
                      className={styles.profileImage}
                      onError={handleImageError}
                      priority
                    />
                    <span className={styles.username}>
                      {session.user.name}
                      {isAdmin && <span className={styles.adminBadge}> ADM</span>}
                    </span>
                  </div>
                </Link>
                <button onClick={handleSignOut} className={styles.signOutButton}>
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login">Entrar</Link>
                <Link href="/auth/register">Cadastrar</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
} 