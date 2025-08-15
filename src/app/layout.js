import MainLayout from '../components/MainLayout';
import AuthProvider from '../components/AuthProvider';
import './globals.css';

export const metadata = {
  title: 'Opinaflix',
  description: 'A platform for sharing and discovering movie reviews',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <head>
      </head>
      <body>
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
