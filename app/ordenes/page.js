'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type Orden = {
  folio: string;
  periodo: string;
  frecuencia: string;
  neto: number;
  estado: string | null;
  verify_token: string;
  fecha_pago?: string | null;
  created_at?: string | null;
};

export default function OrdenesPage() {
  const [rows, setRows] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr('');

      // 1) Usuario actual
      const { data: { user }, error: eUser } = await supabase.auth.getUser();
      if (eUser || !user) {
        setErr('No hay sesión activa');
        setLoading(false);
        return;
      }

      // 2) Enlaza colaborador <-> auth_user_id por email (si hace falta)
      //    (No rompe si la RPC no existe: solo ignoramos el error)
      try { await supabase.rpc('link_me'); } catch (_) {}

      // 3) Busca el colaborador por auth_user_id (no por email)
      const { data: col, error: eCol } = await supabase
        .from('colaborador')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (eCol || !col) {
        setErr('Colaborador desconocido');
        setLoading(false);
        return;
      }

      // 4) Trae órdenes del colaborador
      //    a) Intentamos con columna 'colaborador_id'
      //    b) Si no existe, reintentamos con 'colaborador'
      //    Además, probamos ordenar por 'fecha_pago' y si no existe,
      //    caemos a 'created_at'.
      const selectCols =
        'folio, periodo, frecuencia, neto, estado, verify_token, fecha_pago, created_at';

      async function fetchOrdersBy(columnName: 'colaborador_id' | 'colaborador') {
        const q = supabase
          .from('orden_pago')
          .select(selectCols)
          .eq(columnName, col.id);

        // probar ordenar por fecha_pago y fallback a created_at
        let { data, error } = await q.order('fecha_pago', { ascending: false });
        if (error && /fecha_pago/i.test(error.message)) {
          ({ data, error } = await supabase
            .from('orden_pago')
            .select(selectCols)
            .eq(columnName, col.id)
            .order('created_at', { ascending: false }));
        }
        return { data: (data as Orden[] | null) ?? [], error };
      }

      // intento 1: 'colaborador_id'
      let { data, error } = await fetchOrdersBy('colaborador_id');

      // si la columna no existe, reintenta con 'colaborador'
      if (error && /column .*colaborador_id.* does not exist/i.test(error.message)) {
        ({ data, error } = await fetchOrdersBy('colaborador'));
      }

      if (error) {
        setErr(error.message);
      } e
