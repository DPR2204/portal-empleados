import Link from 'next/link';               // 👈  Faltaba esta línea

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

            <nav style={{ display: 'flex', gap: 18, fontSize: 14 }}>
              <Link href="/">Inicio</Link>
              <Link href="/ordenes">Mis Órdenes</Link>
              <Link href="/colaboradores/nuevo">Nuevo colaborador</Link>
            </nav>
          </header>

          {children}

          <footer style={{ marginTop: 40, fontSize: 12, color: '#666' }}>
            © {new Date().getFullYear()} Portal Empleados
          </footer>
        </div>
      </body>
    </html>
  );
}
