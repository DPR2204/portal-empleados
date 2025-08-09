return (
  <main className="section">
    <div className="card stack-12">
      <h2 className="h2">Mis Órdenes</h2>
      {rows.length === 0 ? (
        <p className="muted">Aún no tienes órdenes emitidas.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Folio</th>
                <th>Frecuencia</th>
                <th>Neto</th>
                <th>Estado</th>
                <th style={{width:120}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.folio}>
                  <td>{r.periodo}</td>
                  <td>{r.folio}</td>
                  <td>{r.frecuencia}</td>
                  <td>{new Intl.NumberFormat('es-GT', { style:'currency', currency:'GTQ' }).format(r.neto)}</td>
                  <td>
                    <span className={`badge ${r.estado === 'EMITIDO' ? 'ok' : 'warn'}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <a className="btn" href={`/verify/${r.verify_token}`} target="_blank" rel="noreferrer">Verificar</a>
                      <a className="btn" href={`/api/ordenes/pdf/${r.verify_token}`} target="_blank" rel="noreferrer">PDF</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </main>
);
