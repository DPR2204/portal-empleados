// app/layout.js
export const metadata = {
  title: 'Portal de Empleados',
  description: 'MVP Portal Empleados — Órdenes de Pago',
};

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header>
          <div className="container">
            <h1>Portal de Empleados</h1>
            <nav>
              <a href="/">Inicio</a>
              <a href="/ordenes">Mis Órdenes</a>
              <a href="/ordenes/nueva">Nueva Orden</a>
              <a href="/colaboradores/nuevo">Nuevo Colaborador</a>
              <a href="/verify">Verificar Folio</a>
              <a href="/admin">Admin</a>
            </nav>
          </div>
        </header>

        <main className="container">{children}</main>

        <footer className="footer">
          <div className="container">© {new Date().getFullYear()} Portal Empleados</div>
        </footer>
      </body>
    </html>
  );
}
