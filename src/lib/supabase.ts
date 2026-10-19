import { createClient } from '@supabase/supabase-js';

// Helper dinámico para instanciar el cliente de Supabase
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    '';

  if (!url || !key || url.includes('tu-proyecto') || key.includes('tu-anon-key')) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  });
}

export const isSupabaseConfigured = Boolean(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '') &&
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '') &&
  !(process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('tu-proyecto')
);

export const supabase = getSupabase();

export interface SolicitudInstalacion {
  id: string;
  created_at: string;
  nombre: string;
  nombre_farmacia: string;
  direccion: string;
  estado_ciudad: string;
  telefono: string;
  correo?: string;
  codigo_cobeca?: string;
  sistema_actual?: string;
  comentarios?: string;
  notas?: string;
  latitud?: number;
  longitud?: number;
  estatus: 'nuevo' | 'contactado' | 'en_proceso' | 'instalado' | 'no_interesado';
}

/*
  =======================================================
  ESQUEMA SQL PARA EJECUTAR EN EL SQL EDITOR DE SUPABASE:
  =======================================================

  create table if not exists solicitudes_instalacion (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    nombre text not null,
    nombre_farmacia text not null,
    direccion text not null,
    estado_ciudad text,
    telefono text not null,
    correo text,
    codigo_cobeca text,
    sistema_actual text,
    comentarios text,
    notas text,
    latitud double precision,
    longitud double precision,
    estatus text default 'nuevo' not null
  );

  -- Si ya tienes la tabla creada, ejecuta simplemente estas líneas:
  alter table solicitudes_instalacion add column if not exists notas text;
  alter table solicitudes_instalacion add column if not exists latitud double precision;
  alter table solicitudes_instalacion add column if not exists longitud double precision;

  -- Habilitar RLS (Row Level Security)
  alter table solicitudes_instalacion enable row level security;

  -- Permitir inserción anónima desde el formulario web
  create policy "Permitir insercion publica" on solicitudes_instalacion
    for insert with check (true);

  -- Permitir lectura y actualización con service_role
  create policy "Permitir lectura completa" on solicitudes_instalacion
    for select using (true);

  create policy "Permitir actualizacion completa" on solicitudes_instalacion
    for update using (true);
*/
