// app/layout.js  (SERVER component — sin "use client")
import './globals.css';

export const metadata = {
  title: 'Portal de Empleados',
  description: 'MVP Portal Empleados - Órdenes de Pago',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header className="topbar">
          <div className="container topbar__inner">
            <h1 className="logo">Portal de Empleados</h1>
            <nav className="nav">
              <a href="/">Inicio</a>
              <a href="/ordenes">Mis Órdenes</a>
              <a href="/ordenes/nueva">Nueva Orden</a>
              <a href="/colaboradores/nuevo">Nuevo Colaborador</a>
              <a href="/verify">Verificar Folio</a>
              <a href="/dashboard">Admin</a>
            </nav>
          </div>
        </header>

        <div className="container">{children}</div>
        <footer className="footer">
          © {new Date().getFullYear()} Portal Empleados
        </footer>
      </body>
    </html>
  );
}
