'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function VerifyPage({ params }) {
  const { token } = params;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase.rpc('verify_orden', { token_in: token });
      if (error) setError(error.message);
      else setData(data?.[0] || null);
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading) return <main><p>Verificando...</p></main>;
  if (error) return <main><p>Error: {error}</p></main>;
  if (!data) return <main><p>No encontrada o token inválido.</p></main>;

  return (
    <main>
      <h2>Verificación de Orden</h2>
      <p><strong>Folio:</strong> {data.folio}</p>
      <p><strong>Colaborador:</strong> {data.colaborador_nombre}</p>
      <p><strong>Periodo:</strong> {data.periodo} {data.fecha_inicio && data.fecha_fin ? `(${data.fecha_inicio} a ${data.fecha_fin})` : null}</p>
      <p><strong>Frecuencia:</strong> {data.frecuencia}</p>
      <p><strong>Bruto:</strong> Q {data.bruto}</p>
      <p><strong>Adelantos:</strong> Q {data.adelantos}</p>
      <p><strong>Otros descuentos:</strong> Q {data.otros_descuentos}</p>
      <p><strong>Neto:</strong> Q {data.neto}</p>
      <p><strong>Estado:</strong> {data.estado ?? ''}</p>

      {/* Botón para descargar/abrir el PDF */}
      <p style={{ marginTop: 16 }}>
        <a
          href={`/api/ordenes/pdf/${token}`}
          target="_blank"
          rel="noreferrer"
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 8, textDecoration: 'none' }}
        >
          Descargar PDF
        </a>
      </p>

      <p style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        Esta es una vista pública de verificación. No expone datos sensibles adicionales.
      </p>
    </main>
  );
}
