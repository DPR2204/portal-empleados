export const metadata = {
  title: 'Portal de Empleados',
  description: 'MVP Portal Empleados – Órdenes de Pago',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
          {/* ======= CABECERA / MENÚ ======= */}
          <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}>
            <h1 style={{ fontSize: 20 }}>Portal de Empleados</h1>

            {/* Menú de navegación */}
            <nav style={{ display: 'flex', gap: 18, fontSize: 14 }}>
              <a href="/">Inicio</a>
              <a href="/ordenes">Mis Órdenes</a>
              <a href="/colaboradores/nuevo">Nuevo colaborador</a>
            </nav>
          </header>

          {/* contenido de cada página */}
          {children}

          {/* ======= PIE DE PÁGINA ======= */}
          <footer style={{ marginTop: 40, fontSize: 12, color: '#666' }}>
            © {new Date().getFullYear()} Portal Empleados
          </footer>
        </div>
      </body>
    </html>
  );
}
