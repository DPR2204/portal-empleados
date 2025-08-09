return (
  <main className="section">
    <div className="card">
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:6}}>
        <h2 className="h2">Mis Órdenes</h2>
        <span className="kicker">{rows.length} registro{rows.length===1?'':'s'}</span>
      </div>

      {/* Toolbar: buscador simple por folio/periodo */}
      <div className="toolbar">
        <input
          className="input"
          placeholder="Buscar por folio o periodo…"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
        {/* Si luego quieres filtros por estado/fecha, los ponemos aquí */}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <p>Sin resultados. Prueba con otro folio o periodo.</p>
        </div>
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
                <th style={{width:160}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.folio}>
                  <td>{r.periodo}</td>
                  <td>{r.folio}</td>
                  <td>{r.frecuencia}</td>
                  <td>{
                    new Intl.NumberFormat('es-GT', { style:'currency', currency:'GTQ' })
                      .format(Number(r.neto ?? 0))
                  }</td>
                  <td>
                    <span className={`badge ${r.estado === 'EMITIDO' ? 'ok' : 'warn'}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <a className="btn ghost" href={`/verify/${r.verify_token}`} target="_blank" rel="noreferrer">Verificar</a>
                      <a className="btn ghost" href={`/api/ordenes/pdf/${r.verify_token}`} target="_blank" rel="noreferrer">PDF</a>
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
