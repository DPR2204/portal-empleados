// app/layout.js
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Portal de Empleados',
  description: 'Órdenes de pago',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="shell">
          <header className="topbar">
            <div className="brand">Portal de Empleados</div>
            <nav className="nav">
              <a href="/">Inicio</a>
              <a href="/ordenes">Mis Órdenes</a>
              <a href="/ordenes/nueva">Nueva Orden</a>
              <a href="/colaboradores/nuevo">Nuevo Colaborador</a>
              <a href="/verify">Verificar Folio</a>
              <a href="/admin/ordenes">Admin</a>
            </nav>
          </header>
          <main className="container">{children}</main>
        </div>
      </body>
    </html>
  );
}
