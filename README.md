# Portal Empleados (Starter)

Este es un starter **Next.js 14 + Supabase** listo para desplegar en **Vercel**.
Incluye:
- Login con Google vía Supabase (cliente)
- Dashboard básico con cierre de sesión
- Página pública de verificación de Orden (`/verify/[token]`) que usa un RPC en Supabase
- Estructura para seguir construyendo el generador de Órdenes de Pago

## Variables de entorno
Configura en Vercel:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_SITE_URL (p. ej., https://empleados.atitlanrestaurantes.com)

## Pasos rápidos
1. Sube este repo a GitHub.
2. Importa el proyecto en Vercel y pega las env vars.
3. Asigna el dominio `empleados.atitlanrestaurantes.com`.
4. En Supabase, crea el RPC `verify_orden` con el SQL que te pasé en Chat y prueba `/verify/<TOKEN>`.

## Scripts
- `npm run dev` para desarrollo local.
- `npm run build` + `npm start` para producción local.
