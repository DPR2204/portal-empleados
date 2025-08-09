// app/layout.js
import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Portal de Empleados',
  description: 'Gestión de colaboradores y órdenes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <div className="container header-row">
            <div className="logo">Portal de Empleados</div>
            <nav className="nav">
              <Link href="/">Inicio</Link>
              <Link href="/ordenes">Mis Órdenes</Link>
              <Link href="/ordenes/nueva">Nueva Orden</Link>
              <Link href="/colaboradores/nuevo">Nuevo Colaborador</Link>
              <Link href="/verify">Verificar Folio</Link>
              <Link href="/comprobantes/nuevo">Nuevo Comprobante</a>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </header>

        <main className="container">{children}</main>

        <footer className="site-footer">
          <div className="container">© {new Date().getFullYear()} Portal Empleados</div>
        </footer>
      </body>
    </html>
  );
}
