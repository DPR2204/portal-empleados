import './globals.css';

export const metadata = {
  title: 'Portal de Empleados',
  description: 'MVP Portal Empleados - Órdenes de Pago',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div className="container">
          <header className="header">
            <h1 className="brand">Portal de Empleados</h1>
            <nav className="nav">
              <a href="/">Inicio</a>
              <a href="/ordenes">Mis Órdenes</a>
              <a href="/ordenes/nueva">Nueva Orden</a>
              <a href="/colaboradores/nuevo">Nuevo Colaborador</a>
              <a href="/verify">Verificar Folio</a>
              <a href="/admin/ordenes">Admin</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
