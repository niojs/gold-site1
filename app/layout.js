import './globals.css';
import AuthGuard from './components/AuthGuard';

export const metadata = {
  title: 'Gold Manager',
  description: 'Управление геологоразведкой',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}