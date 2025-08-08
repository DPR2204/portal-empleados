// app/layout.js  (Server Component)
import ClientBootstrap from './components/ClientBootstrap';

export const metadata = {
  title: 'Portal de Empleados',
  description: 'MVP Portal Empleados - Órdenes de Pago',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
          <Header />
          <ClientBootstrap />
          {children}
        </div>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
      <h1 style={{ fontSize: 20 }}>Portal de Empleados</h1>
      <nav style={{ display:'flex',gap:16,fontSize:14 }}>
        <a href="/">Inicio</a>
        <a href="/ordenes">Mis Órdenes</a>
        <a href="/ordenes/nueva">Nueva Orden</a>
        <a href="/colaboradores/nuevo">Nuevo Colaborador</a>
        <a href="/verify">Verificar Folio</a>
      </nav>
    </header>
  );
}
