import fs from 'fs';
import path from 'path';
import { SolicitudInstalacion } from './supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'solicitudes.json');

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error inicializando archivo local de almacenamiento:', err);
  }
}

export function getLocalSolicitudes(): SolicitudInstalacion[] {
  try {
    ensureDataFile();
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content) as SolicitudInstalacion[];
  } catch (err) {
    console.error('Error leyendo solicitudes locales:', err);
    return [];
  }
}

export function saveLocalSolicitud(solicitud: Omit<SolicitudInstalacion, 'id' | 'created_at' | 'estatus'> & { estatus?: SolicitudInstalacion['estatus'] }): SolicitudInstalacion {
  ensureDataFile();
  const current = getLocalSolicitudes();
  const newRecord: SolicitudInstalacion = {
    ...solicitud,
    id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
    estatus: solicitud.estatus || 'nuevo',
  };

  const updated = [newRecord, ...current];
  fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return newRecord;
}

export function updateLocalSolicitud(id: string, patch: Partial<SolicitudInstalacion>): boolean {
  try {
    ensureDataFile();
    const current = getLocalSolicitudes();
    const index = current.findIndex((item) => item.id === id);
    if (index === -1) {
      // If it exists in Supabase but not in local cache, create a placeholder
      const placeholder: SolicitudInstalacion = {
        id,
        created_at: new Date().toISOString(),
        nombre: 'Sin nombre',
        nombre_farmacia: 'Sin farmacia',
        direccion: '',
        estado_ciudad: '',
        telefono: '',
        estatus: 'nuevo',
        ...patch,
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify([placeholder, ...current], null, 2), 'utf-8');
      return true;
    }

    current[index] = { ...current[index], ...patch };
    fs.writeFileSync(DATA_FILE, JSON.stringify(current, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error actualizando solicitud local:', err);
    return false;
  }
}

export function updateLocalSolicitudEstatus(id: string, estatus: SolicitudInstalacion['estatus']): boolean {
  return updateLocalSolicitud(id, { estatus });
}
