'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Search, 
  Filter, 
  RefreshCw, 
  Lock, 
  ArrowLeft,
  Eye,
  MessageCircle,
  Copy,
  Check,
  FileText,
  Save,
  AlertCircle,
  MapPin,
  Navigation,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { SolicitudInstalacion } from '@/lib/supabase';

const DEFAULT_PIN = 'sitco2026';

export default function AdminInstalacionesPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  const [solicitudes, setSolicitudes] = useState<SolicitudInstalacion[]>([]);
  const [dataSource, setDataSource] = useState<'supabase' | 'local' | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedRecord, setSelectedRecord] = useState<SolicitudInstalacion | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estados para notas administrativas
  const [editingNoteRecord, setEditingNoteRecord] = useState<SolicitudInstalacion | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // Estados para geolocalización GPS de visitas
  const [editingGpsRecord, setEditingGpsRecord] = useState<SolicitudInstalacion | null>(null);
  const [gpsInput, setGpsInput] = useState('');
  const [detectedGps, setDetectedGps] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [capturingGps, setCapturingGps] = useState(false);
  const [savingGps, setSavingGps] = useState(false);
  const [gpsFeedback, setGpsFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // Verificar autenticación
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === DEFAULT_PIN) {
      setIsAuthenticated(true);
      setAuthError('');
      sessionStorage.setItem('sitco_admin_auth', pin.trim());
      fetchSolicitudes(pin.trim());
    } else {
      setAuthError('Código de acceso incorrecto. Verifica con el administrador.');
    }
  };

  useEffect(() => {
    const savedPin = sessionStorage.getItem('sitco_admin_auth');
    if (savedPin === DEFAULT_PIN) {
      setIsAuthenticated(true);
      fetchSolicitudes(savedPin);
    }
  }, []);

  const fetchSolicitudes = async (accessKey: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/solicitudes-instalacion?adminKey=${encodeURIComponent(accessKey)}&_t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSolicitudes(data.data || []);
        setDataSource(data.source || 'supabase');
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error('Error cargando solicitudes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estatus de una solicitud
  const handleUpdateStatus = async (id: string, newStatus: SolicitudInstalacion['estatus']) => {
    setUpdatingId(id);
    try {
      const activePin = sessionStorage.getItem('sitco_admin_auth') || DEFAULT_PIN;
      const res = await fetch(`/api/solicitudes-instalacion?adminKey=${encodeURIComponent(activePin)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estatus: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSolicitudes((prev) =>
          prev.map((item) => (item.id === id ? { ...item, estatus: newStatus } : item))
        );
        if (selectedRecord && selectedRecord.id === id) {
          setSelectedRecord((prev) => (prev ? { ...prev, estatus: newStatus } : null));
        }
      }
    } catch (err) {
      console.error('Error actualizando estatus:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Abrir modal de notas
  const openNoteModal = (record: SolicitudInstalacion) => {
    setEditingNoteRecord(record);
    setNoteContent(record.notas || '');
    setNoteFeedback(null);
  };

  // Guardar nota administrativa
  const handleSaveNote = async () => {
    if (!editingNoteRecord) return;
    setSavingNote(true);
    setNoteFeedback(null);
    try {
      const activePin = sessionStorage.getItem('sitco_admin_auth') || DEFAULT_PIN;
      const res = await fetch(`/api/solicitudes-instalacion?adminKey=${encodeURIComponent(activePin)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingNoteRecord.id, notas: noteContent }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSolicitudes((prev) =>
          prev.map((item) => (item.id === editingNoteRecord.id ? { ...item, notas: noteContent } : item))
        );
        if (selectedRecord && selectedRecord.id === editingNoteRecord.id) {
          setSelectedRecord((prev) => (prev ? { ...prev, notas: noteContent } : null));
        }

        if (data.warning === 'MISSING_NOTAS_COLUMN') {
          setNoteFeedback({
            type: 'warning',
            message: 'Nota guardada exitosamente en el sistema. Para sincronizarla de forma nativa en Supabase, ejecuta una sola vez en el Editor SQL: ALTER TABLE solicitudes_instalacion ADD COLUMN IF NOT EXISTS notas text;',
          });
        } else {
          setNoteFeedback({
            type: 'success',
            message: 'Nota guardada con éxito.',
          });
          setTimeout(() => {
            setEditingNoteRecord(null);
            setNoteFeedback(null);
          }, 1000);
        }
      } else {
        setNoteFeedback({
          type: 'error',
          message: data.error || 'Error al guardar la nota.',
        });
      }
    } catch (err) {
      console.error('Error guardando nota:', err);
      setNoteFeedback({
        type: 'error',
        message: 'Error de conexión al guardar nota.',
      });
    } finally {
      setSavingNote(false);
    }
  };

  // Abrir modal de GPS
  const openGpsModal = (record: SolicitudInstalacion) => {
    setEditingGpsRecord(record);
    if (record.latitud && record.longitud) {
      setDetectedGps({ lat: record.latitud, lng: record.longitud });
      setGpsInput(`${record.latitud}, ${record.longitud}`);
    } else {
      setDetectedGps(null);
      setGpsInput('');
    }
    setGpsFeedback(null);
  };

  // Parsear coordenadas desde texto o enlaces de Google Maps
  const parseCoordinates = (input: string): { lat: number; lng: number } | null => {
    const text = input.trim();
    if (!text) return null;

    // Patrón 1: "lat, lng" o "lat lng" (ej: 10.6427, -71.6125)
    const simpleMatch = text.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (simpleMatch) {
      const lat = parseFloat(simpleMatch[1]);
      const lng = parseFloat(simpleMatch[3]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }

    // Patrón 2: Google Maps con ?q=lat,lng
    const qMatch = text.match(/[?&]q=(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/);
    if (qMatch) {
      const lat = parseFloat(qMatch[1]);
      const lng = parseFloat(qMatch[3]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    // Patrón 3: Google Maps con /@lat,lng
    const atMatch = text.match(/@(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[3]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    return null;
  };

  // Capturar ubicación con el GPS del navegador
  const handleCaptureAdminGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsFeedback({
        type: 'error',
        message: 'Tu dispositivo o navegador no soporta geolocalización GPS.',
      });
      return;
    }

    setCapturingGps(true);
    setGpsFeedback(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCapturingGps(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setDetectedGps({
          lat,
          lng,
          accuracy: pos.coords.accuracy,
        });
        setGpsInput(`${lat}, ${lng}`);
        setGpsFeedback({
          type: 'success',
          message: `¡Ubicación satelital capturada! Margen: ±${Math.round(pos.coords.accuracy)}m.`,
        });
      },
      (err) => {
        setCapturingGps(false);
        let msg = 'No se pudo obtener la ubicación GPS.';
        if (err.code === 1) msg = 'Permiso de ubicación denegado en tu navegador.';
        else if (err.code === 2) msg = 'Señal de GPS no disponible en este momento.';
        else if (err.code === 3) msg = 'Tiempo de espera agotado al conectar con el sensor GPS.';
        setGpsFeedback({ type: 'error', message: msg });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Guardar ubicación GPS
  const handleSaveGps = async () => {
    if (!editingGpsRecord) return;

    let targetCoords = detectedGps;
    if (gpsInput.trim()) {
      const parsed = parseCoordinates(gpsInput);
      if (parsed) {
        targetCoords = parsed;
      }
    }

    if (!targetCoords) {
      setGpsFeedback({
        type: 'error',
        message: 'Por favor captura la ubicación actual o ingresa coordenadas válidas (ej: 10.6427, -71.6125).',
      });
      return;
    }

    setSavingGps(true);
    setGpsFeedback(null);
    try {
      const activePin = sessionStorage.getItem('sitco_admin_auth') || DEFAULT_PIN;
      const res = await fetch(`/api/solicitudes-instalacion?adminKey=${encodeURIComponent(activePin)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingGpsRecord.id,
          latitud: targetCoords.lat,
          longitud: targetCoords.lng,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        const { lat, lng } = targetCoords;
        setSolicitudes((prev) =>
          prev.map((item) => (item.id === editingGpsRecord.id ? { ...item, latitud: lat, longitud: lng } : item))
        );
        if (selectedRecord && selectedRecord.id === editingGpsRecord.id) {
          setSelectedRecord((prev) => (prev ? { ...prev, latitud: lat, longitud: lng } : null));
        }

        if (data.warning === 'MISSING_COLUMNS') {
          setGpsFeedback({
            type: 'warning',
            message: 'Ubicación GPS guardada en el sistema. Para sincronizarla directamente en Supabase, ejecuta en su SQL Editor: ALTER TABLE solicitudes_instalacion ADD COLUMN IF NOT EXISTS latitud double precision, ADD COLUMN IF NOT EXISTS longitud double precision;',
          });
        } else {
          setGpsFeedback({
            type: 'success',
            message: 'Ubicación GPS guardada con éxito.',
          });
          setTimeout(() => {
            setEditingGpsRecord(null);
            setGpsFeedback(null);
          }, 1200);
        }
      } else {
        setGpsFeedback({
          type: 'error',
          message: data.error || 'Error al guardar la ubicación GPS.',
        });
      }
    } catch (err) {
      console.error('Error guardando GPS:', err);
      setGpsFeedback({
        type: 'error',
        message: 'Error de conexión al guardar ubicación GPS.',
      });
    } finally {
      setSavingGps(false);
    }
  };

  // Filtrado y búsqueda
  const filteredSolicitudes = useMemo(() => {
    return solicitudes.filter((item) => {
      const matchesStatus = statusFilter === 'todos' || item.estatus === statusFilter;
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.nombre.toLowerCase().includes(query) ||
        item.nombre_farmacia.toLowerCase().includes(query) ||
        item.telefono.toLowerCase().includes(query) ||
        (item.codigo_cobeca && item.codigo_cobeca.toLowerCase().includes(query)) ||
        (item.estado_ciudad && item.estado_ciudad.toLowerCase().includes(query)) ||
        (item.correo && item.correo.toLowerCase().includes(query)) ||
        (item.notas && item.notas.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [solicitudes, statusFilter, search]);

  // Contadores
  const stats = useMemo(() => {
    return {
      total: solicitudes.length,
      nuevas: solicitudes.filter((s) => s.estatus === 'nuevo').length,
      contactadas: solicitudes.filter((s) => s.estatus === 'contactado' || s.estatus === 'en_proceso').length,
      instaladas: solicitudes.filter((s) => s.estatus === 'instalado').length,
      noInteresadas: solicitudes.filter((s) => s.estatus === 'no_interesado').length,
    };
  }, [solicitudes]);

  // Descargar EXCEL (CSV con UTF-8 BOM compatible al 100% con Microsoft Excel)
  const handleExportExcel = () => {
    if (filteredSolicitudes.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const headers = [
      'ID',
      'Fecha Registro',
      'Nombre Contacto',
      'Nombre Farmacia',
      'Código COBECA',
      'Teléfono',
      'Correo',
      'Estado / Ciudad',
      'Dirección',
      'Latitud',
      'Longitud',
      'Enlace Google Maps',
      'Sistema Actual',
      'Comentarios Cliente',
      'Estatus',
      'Notas Administrativas',
    ];

    const formatStatusName = (est: string) => {
      switch (est) {
        case 'nuevo': return 'Nuevo';
        case 'contactado': return 'Contactado';
        case 'en_proceso': return 'En Proceso';
        case 'instalado': return 'Instalado';
        case 'no_interesado': return 'No Interesado';
        default: return est;
      }
    };

    const rows = filteredSolicitudes.map((item) => [
      `"${item.id}"`,
      `"${new Date(item.created_at).toLocaleString('es-VE')}"`,
      `"${item.nombre.replace(/"/g, '""')}"`,
      `"${item.nombre_farmacia.replace(/"/g, '""')}"`,
      `"${(item.codigo_cobeca || 'N/A').replace(/"/g, '""')}"`,
      `"${item.telefono.replace(/"/g, '""')}"`,
      `"${(item.correo || 'N/A').replace(/"/g, '""')}"`,
      `"${(item.estado_ciudad || 'N/A').replace(/"/g, '""')}"`,
      `"${item.direccion.replace(/"/g, '""')}"`,
      `"${item.latitud !== undefined && item.latitud !== null ? item.latitud : ''}"`,
      `"${item.longitud !== undefined && item.longitud !== null ? item.longitud : ''}"`,
      `"${item.latitud && item.longitud ? `https://www.google.com/maps?q=${item.latitud},${item.longitud}` : ''}"`,
      `"${(item.sistema_actual || 'N/A').replace(/"/g, '""')}"`,
      `"${(item.comentarios || '').replace(/"/g, '""')}"`,
      `"${formatStatusName(item.estatus)}"`,
      `"${(item.notas || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SITCO_Solicitudes_Instalacion_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Imprimir / Descargar PDF
  const handlePrintPdf = () => {
    window.print();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // PANTALLA DE ACCESO RESTRINGIDO
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-800/90 border border-slate-700 p-8 shadow-2xl backdrop-blur-xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7bc143]/20 text-[#7bc143]">
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Portal Administrativo SITCO</h1>
          <p className="text-xs text-slate-400 mb-6">
            Ingresa la clave de acceso autorizada para visualizar las solicitudes de instalación de clientes.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Código de acceso"
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-center text-lg font-mono text-white tracking-widest placeholder:text-slate-500 outline-none focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]"
            />

            {authError && (
              <p className="text-xs text-red-400 font-medium bg-red-900/20 py-2 rounded-lg border border-red-800/40">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#7bc143] py-3 text-sm font-black text-white shadow-lg shadow-[#7bc143]/20 transition-all hover:bg-[#6aad3a]"
            >
              Ingresar al Panel
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/60">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Volver a la página principal</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // PANTALLA PRINCIPAL DEL PANEL ADMINISTRATIVO
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Barra Superior */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link
                href="/"
                className="p-2 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all"
                title="Volver a la web"
              >
                <ArrowLeft size={18} />
              </Link>
              <h1 className="text-2xl md:text-3xl font-black text-white">
                Solicitudes de Instalación <span className="text-[#7bc143]">Smart Pharma</span>
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 ml-11">
              <p className="text-xs text-slate-400">
                Registro y seguimiento de clientes farmacéuticos interesados en el software.
              </p>
              {dataSource === 'supabase' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Base de Datos: Supabase (En vivo)
                </span>
              )}
              {dataSource === 'local' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Base de Datos: Respaldo Local (JSON)
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchSolicitudes(pin || DEFAULT_PIN)}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Actualizar</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all"
            >
              <FileSpreadsheet size={15} />
              <span>Descargar Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-all"
            >
              <Printer size={15} />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Tarjetas KPI de Resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total</p>
            <p className="text-2xl md:text-3xl font-black text-white mt-1">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-950/30 p-4 backdrop-blur-md">
            <p className="text-[11px] font-black uppercase tracking-wider text-sky-400">Nuevas</p>
            <p className="text-2xl md:text-3xl font-black text-sky-300 mt-1">{stats.nuevas}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-950/30 p-4 backdrop-blur-md">
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-400">En Proceso</p>
            <p className="text-2xl md:text-3xl font-black text-amber-300 mt-1">{stats.contactadas}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-4 backdrop-blur-md">
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-400">Instaladas</p>
            <p className="text-2xl md:text-3xl font-black text-emerald-300 mt-1">{stats.instaladas}</p>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-950/30 p-4 backdrop-blur-md col-span-2 sm:col-span-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-rose-400">No Interesados</p>
            <p className="text-2xl md:text-3xl font-black text-rose-300 mt-1">{stats.noInteresadas}</p>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 p-3 backdrop-blur-md">
          <div className="relative w-full sm:w-96">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, farmacia, teléfono, código..."
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#7bc143]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
              <Filter size={14} />
              Estatus:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#7bc143]"
            >
              <option value="todos">Todos los estatus ({stats.total})</option>
              <option value="nuevo">Nuevos ({stats.nuevas})</option>
              <option value="contactado">Contactados</option>
              <option value="en_proceso">En Proceso</option>
              <option value="instalado">Instalados ({stats.instaladas})</option>
              <option value="no_interesado">No Interesados ({stats.noInteresadas})</option>
            </select>
          </div>
        </div>

        {/* Tabla de Datos */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Contacto / Teléfono</th>
                  <th className="py-3.5 px-4">Farmacia / Código COBECA</th>
                  <th className="py-3.5 px-4">Ubicación</th>
                  <th className="py-3.5 px-4">Estatus</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSolicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw size={18} className="animate-spin text-[#7bc143]" />
                          <span>Cargando solicitudes...</span>
                        </div>
                      ) : (
                        <span>No se encontraron solicitudes registradas con los filtros aplicados.</span>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredSolicitudes.map((item) => {
                    const cleanPhone = item.telefono.replace(/\D/g, '');
                    const waNumber = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone}`;
                    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(
                      `Hola ${item.nombre}, te contactamos de SITCO respecto a tu solicitud de instalación de Smart Pharma para ${item.nombre_farmacia}.`
                    )}`;

                    return (
                      <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString('es-VE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                          <span className="block text-[10px] text-slate-500">
                            {new Date(item.created_at).toLocaleTimeString('es-VE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{item.nombre}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-slate-300">{item.telefono}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.telefono, item.id)}
                              className="text-slate-500 hover:text-white transition-colors"
                              title="Copiar número"
                            >
                              {copiedId === item.id ? (
                                <Check size={12} className="text-[#7bc143]" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{item.nombre_farmacia}</span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {item.codigo_cobeca && item.codigo_cobeca !== 'No posee' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#7bc143]/20 px-2 py-0.5 text-[9px] font-black text-[#7bc143] uppercase tracking-wider">
                                COBECA: {item.codigo_cobeca}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Sin código COBECA</span>
                            )}
                            {item.notas && (
                              <button
                                type="button"
                                onClick={() => openNoteModal(item)}
                                className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-500/25 max-w-[200px] truncate transition-all text-left"
                                title={`Nota: ${item.notas} (Clic para editar)`}
                              >
                                <FileText size={10} className="shrink-0 text-amber-400" />
                                <span className="truncate">{item.notas}</span>
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="text-slate-300 font-medium block truncate">
                            {item.estado_ciudad || 'No especificado'}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate block">
                            {item.direccion}
                          </span>
                          {item.latitud && item.longitud ? (
                            <a
                              href={`https://www.google.com/maps?q=${item.latitud},${item.longitud}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 rounded-md bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold text-sky-300 hover:bg-sky-500/25 transition-all"
                              title={`GPS: ${item.latitud.toFixed(5)}, ${item.longitud.toFixed(5)} (Abrir en Google Maps)`}
                            >
                              <MapPin size={10} className="shrink-0 text-sky-400" />
                              <span>GPS: {item.latitud.toFixed(4)}, {item.longitud.toFixed(4)}</span>
                            </a>
                          ) : null}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <select
                            value={item.estatus}
                            disabled={updatingId === item.id}
                            onChange={(e) => handleUpdateStatus(item.id, e.target.value as SolicitudInstalacion['estatus'])}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold outline-none border transition-all ${
                              item.estatus === 'nuevo'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                : item.estatus === 'contactado'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : item.estatus === 'en_proceso'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                : item.estatus === 'instalado'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            <option value="nuevo" className="bg-slate-900 text-sky-400">Nuevo</option>
                            <option value="contactado" className="bg-slate-900 text-amber-400">Contactado</option>
                            <option value="en_proceso" className="bg-slate-900 text-purple-400">En Proceso</option>
                            <option value="instalado" className="bg-slate-900 text-emerald-400">Instalado</option>
                            <option value="no_interesado" className="bg-slate-900 text-rose-400">No Interesado</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openGpsModal(item)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                item.latitud && item.longitud
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500 hover:text-white shadow-sm'
                                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/15 hover:text-white'
                              }`}
                              title={
                                item.latitud && item.longitud
                                  ? `GPS Registrado: ${item.latitud.toFixed(5)}, ${item.longitud.toFixed(5)} (Clic para ver/editar)`
                                  : 'Registrar ubicación GPS de la visita'
                              }
                            >
                              <MapPin size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openNoteModal(item)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                item.notas
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 shadow-sm'
                                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/15 hover:text-white'
                              }`}
                              title={item.notas ? `Nota: ${item.notas} (Clic para editar)` : 'Agregar nota de seguimiento'}
                            >
                              <FileText size={15} />
                            </button>
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                              title="Escribir por WhatsApp"
                            >
                              <MessageCircle size={15} />
                            </a>
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(item)}
                              className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white hover:text-slate-950 transition-all"
                              title="Ver ficha completa"
                            >
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Detalle Completo de Ficha */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-slate-900 p-6 md:p-8 text-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#7bc143]">
                    Ficha de Solicitud de Instalación
                  </span>
                  <h3 className="text-xl font-black text-white">{selectedRecord.nombre_farmacia}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="rounded-xl border border-white/10 p-2 text-white/60 hover:text-white hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-slate-400">Estatus:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    selectedRecord.estatus === 'nuevo'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : selectedRecord.estatus === 'contactado'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : selectedRecord.estatus === 'en_proceso'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : selectedRecord.estatus === 'instalado'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {selectedRecord.estatus === 'nuevo' && 'Nuevo'}
                    {selectedRecord.estatus === 'contactado' && 'Contactado'}
                    {selectedRecord.estatus === 'en_proceso' && 'En Proceso'}
                    {selectedRecord.estatus === 'instalado' && 'Instalado'}
                    {selectedRecord.estatus === 'no_interesado' && 'No Interesado'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Contacto:</span>
                  <span className="font-bold text-white">{selectedRecord.nombre}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Teléfono:</span>
                  <span className="font-mono font-bold text-emerald-400">{selectedRecord.telefono}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Correo Electrónico:</span>
                  <span className="text-white">{selectedRecord.correo || 'No especificado'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Código Farmacia COBECA:</span>
                  <span className="font-bold text-[#7bc143]">{selectedRecord.codigo_cobeca || 'No posee'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Estado / Ciudad:</span>
                  <span className="text-white">{selectedRecord.estado_ciudad || 'No especificado'}</span>
                </div>
                <div className="py-1 border-b border-white/5">
                  <span className="text-slate-400 block mb-1">Dirección Física:</span>
                  <p className="text-white/90 bg-white/5 p-2.5 rounded-xl">{selectedRecord.direccion}</p>
                </div>
                {/* Sección de Ubicación GPS en Ficha */}
                <div className="py-2 border-b border-white/5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sky-400 font-bold flex items-center gap-1.5 text-xs">
                      <MapPin size={13} />
                      Ubicación Satelital GPS:
                    </span>
                    <button
                      type="button"
                      onClick={() => openGpsModal(selectedRecord)}
                      className="text-[10px] text-sky-300 hover:text-white bg-sky-500/20 hover:bg-sky-500/40 px-2.5 py-1 rounded-lg border border-sky-500/30 transition-all font-bold"
                    >
                      {selectedRecord.latitud && selectedRecord.longitud ? 'Editar GPS' : '+ Registrar GPS'}
                    </button>
                  </div>
                  {selectedRecord.latitud && selectedRecord.longitud ? (
                    <div className="bg-sky-950/30 border border-sky-500/25 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-sky-200 text-xs font-bold">
                        {selectedRecord.latitud.toFixed(6)}, {selectedRecord.longitud.toFixed(6)}
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.google.com/maps?q=${selectedRecord.latitud},${selectedRecord.longitud}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500 text-slate-950 font-bold text-[11px] hover:bg-sky-400 transition-all shadow-sm"
                        >
                          <ExternalLink size={12} />
                          <span>Google Maps</span>
                        </a>
                        <a
                          href={`https://waze.com/ul?ll=${selectedRecord.latitud},${selectedRecord.longitud}&navigate=yes`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500 text-white font-bold text-[11px] hover:bg-indigo-400 transition-all shadow-sm"
                        >
                          <Navigation size={12} />
                          <span>Waze</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-[11px] bg-white/[0.02] p-2 rounded-xl">
                      Sin coordenadas GPS registradas aún. Haz clic en &quot;+ Registrar GPS&quot; durante la visita a la farmacia para capturar la ubicación exacta.
                    </p>
                  )}
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Sistema Administrativo Actual:</span>
                  <span className="text-white font-medium">{selectedRecord.sistema_actual || 'Ninguno'}</span>
                </div>
                {selectedRecord.comentarios && (
                  <div className="py-1 border-b border-white/5">
                    <span className="text-slate-400 block mb-1">Comentarios del Cliente:</span>
                    <p className="text-white/90 bg-white/5 p-2.5 rounded-xl">{selectedRecord.comentarios}</p>
                  </div>
                )}

                {/* Sección de Nota Administrativa en Ficha */}
                <div className="py-2 mt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                      <FileText size={13} />
                      Nota Administrativa / Seguimiento:
                    </span>
                    <button
                      type="button"
                      onClick={() => openNoteModal(selectedRecord)}
                      className="text-[10px] text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/40 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all font-bold"
                    >
                      {selectedRecord.notas ? 'Editar Nota' : '+ Agregar Nota'}
                    </button>
                  </div>
                  {selectedRecord.notas ? (
                    <p className="text-amber-100/90 bg-amber-950/30 border border-amber-500/20 p-2.5 rounded-xl whitespace-pre-wrap text-xs">
                      {selectedRecord.notas}
                    </p>
                  ) : (
                    <p className="text-slate-500 italic text-[11px] bg-white/[0.02] p-2.5 rounded-xl">
                      Sin notas registradas para este cliente. Haz clic en &quot;+ Agregar Nota&quot; para registrar motivos de no interés, acuerdos de llamadas o notas de seguimiento.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex gap-3">
                <a
                  href={`https://wa.me/${selectedRecord.telefono.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white hover:bg-emerald-500 transition-all shadow-lg"
                >
                  <MessageCircle size={15} />
                  <span>Contactar por WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="rounded-xl border border-white/20 px-5 py-3 text-xs font-bold text-white hover:bg-white/10"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Dedicado para Agregar / Editar Nota Administrativa */}
        {editingNoteRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-slate-900 p-6 md:p-8 text-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      Nota de Seguimiento SITCO
                    </span>
                    <h3 className="text-lg font-black text-white">{editingNoteRecord.nombre_farmacia}</h3>
                    <p className="text-xs text-slate-400">{editingNoteRecord.nombre} • {editingNoteRecord.telefono}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingNoteRecord(null)}
                  className="rounded-xl border border-white/10 p-2 text-white/60 hover:text-white hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              {/* Botones de sugerencias rápidas / plantillas */}
              <div className="mb-3">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Plantillas de motivos / notas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'No interesado: costo de inversión',
                    'No interesado: ya renovó con otro sistema',
                    'No interesado: no tiene equipos compatibles',
                    'Llamar la próxima semana',
                    'Solicitó cotización por correo',
                    'Solicitó demostración técnica',
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => {
                        setNoteContent((prev) => (prev ? `${prev}\n• ${phrase}` : `• ${phrase}`));
                      }}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-all text-left"
                    >
                      + {phrase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea para escribir la nota */}
              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-bold text-slate-300">
                  Observaciones internas del cliente:
                </label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Escribe aquí las observaciones: razones por las cuales no desea el sistema, detalles de la llamada, acuerdos o fecha estimada de seguimiento..."
                  className="w-full rounded-2xl border border-white/15 bg-slate-950 p-3.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>

              {/* Mensaje de Feedback */}
              {noteFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs mb-4 flex items-start gap-2 ${
                    noteFeedback.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : noteFeedback.type === 'warning'
                      ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{noteFeedback.message}</p>
                    {noteFeedback.type === 'warning' && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard('ALTER TABLE solicitudes_instalacion ADD COLUMN IF NOT EXISTS notas text;', 'sql-notas')}
                        className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] hover:bg-amber-300 transition-all"
                      >
                        {copiedId === 'sql-notas' ? <Check size={12} /> : <Copy size={12} />}
                        Copiar comando SQL para Supabase
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Acciones del Modal */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingNoteRecord(null)}
                  className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all disabled:opacity-50"
                >
                  {savingNote ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{savingNote ? 'Guardando...' : 'Guardar Nota'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Dedicado para Ubicación GPS de la Visita */}
        {editingGpsRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-slate-900 p-6 md:p-8 text-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                      Ubicación GPS de la Visita
                    </span>
                    <h3 className="text-lg font-black text-white">{editingGpsRecord.nombre_farmacia}</h3>
                    <p className="text-xs text-slate-400">{editingGpsRecord.nombre} • {editingGpsRecord.direccion}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingGpsRecord(null)}
                  className="rounded-xl border border-white/10 p-2 text-white/60 hover:text-white hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              {/* Botón Principal: Capturar ubicación del sensor GPS del celular/dispositivo */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleCaptureAdminGps}
                  disabled={capturingGps}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 p-4 text-sm font-black text-white shadow-xl shadow-sky-600/20 transition-all disabled:opacity-50"
                >
                  {capturingGps ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Conectando con sensor satelital GPS...</span>
                    </>
                  ) : (
                    <>
                      <Navigation size={18} className="text-sky-200" />
                      <span>📡 Capturar mi ubicación actual aquí (GPS del Celular)</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-1.5">
                  Presiona este botón durante tu visita presencial a la farmacia para capturar las coordenadas exactas.
                </p>
              </div>

              {/* Entrada manual o enlace de Google Maps */}
              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-bold text-slate-300">
                  O ingresa coordenadas manualmente / pega enlace de Google Maps:
                </label>
                <input
                  type="text"
                  value={gpsInput}
                  onChange={(e) => {
                    setGpsInput(e.target.value);
                    const parsed = parseCoordinates(e.target.value);
                    if (parsed) {
                      setDetectedGps(parsed);
                    }
                  }}
                  placeholder="Ej: 10.6427, -71.6125 o enlace de Google Maps"
                  className="w-full rounded-2xl border border-white/15 bg-slate-950 p-3.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 font-mono transition-all"
                />
              </div>

              {/* Vista previa y prueba en vivo de rutas */}
              {detectedGps && (
                <div className="mb-4 rounded-2xl border border-sky-500/30 bg-sky-950/40 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                      <Check size={14} className="text-sky-400" />
                      Coordenadas detectadas:
                    </span>
                    <span className="font-mono text-xs text-white font-bold">
                      {detectedGps.lat.toFixed(6)}, {detectedGps.lng.toFixed(6)}
                    </span>
                  </div>
                  {detectedGps.accuracy && (
                    <p className="text-[10px] text-slate-400">
                      Margen de precisión satelital: ±{Math.round(detectedGps.accuracy)} metros
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <a
                      href={`https://www.google.com/maps?q=${detectedGps.lat},${detectedGps.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 text-[11px] font-bold transition-all"
                    >
                      🗺️ Probar en Google Maps
                    </a>
                    <a
                      href={`https://waze.com/ul?ll=${detectedGps.lat},${detectedGps.lng}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold transition-all"
                    >
                      🚗 Probar en Waze
                    </a>
                  </div>
                </div>
              )}

              {/* Feedback Alert */}
              {gpsFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs mb-4 flex items-start gap-2 ${
                    gpsFeedback.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : gpsFeedback.type === 'warning'
                      ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{gpsFeedback.message}</p>
                    {gpsFeedback.type === 'warning' && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard('ALTER TABLE solicitudes_instalacion ADD COLUMN IF NOT EXISTS latitud double precision, ADD COLUMN IF NOT EXISTS longitud double precision;', 'sql-gps')}
                        className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] hover:bg-amber-300 transition-all"
                      >
                        {copiedId === 'sql-gps' ? <Check size={12} /> : <Copy size={12} />}
                        Copiar comando SQL para Supabase
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Acciones del Modal */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingGpsRecord(null)}
                  className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleSaveGps}
                  disabled={savingGps || (!detectedGps && !gpsInput.trim())}
                  className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition-all disabled:opacity-50"
                >
                  {savingGps ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{savingGps ? 'Guardando...' : 'Guardar Ubicación GPS'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
