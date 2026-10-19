'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  RefreshCw,
  Navigation
} from 'lucide-react';

interface FormState {
  nombre: string;
  nombreFarmacia: string;
  direccion: string;
  estadoCiudad: string;
  telefono: string;
  correo: string;
  hasCobecaCode: boolean;
  codigoCobeca: string;
  sistemaActual: string;
  comentarios: string;
}

const INITIAL_STATE: FormState = {
  nombre: '',
  nombreFarmacia: '',
  direccion: '',
  estadoCiudad: '',
  telefono: '',
  correo: '',
  hasCobecaCode: false,
  codigoCobeca: '',
  sistemaActual: '',
  comentarios: '',
};

export function InstallationRequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState<FormState>(INITIAL_STATE);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Estados para geolocalización GPS
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [capturingGps, setCapturingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const handleCaptureGPS = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Tu dispositivo o navegador no soporta geolocalización GPS.');
      return;
    }

    setCapturingGps(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCapturingGps(false);
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setCapturingGps(false);
        let msg = 'No se pudo obtener la ubicación GPS.';
        if (err.code === 1) msg = 'Permiso de ubicación denegado. Habilita los permisos de GPS en tu navegador.';
        else if (err.code === 2) msg = 'Señal de GPS no disponible en este momento.';
        else if (err.code === 3) msg = 'Tiempo de espera agotado al conectar con el GPS.';
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        nombreFarmacia: formData.nombreFarmacia.trim(),
        direccion: formData.direccion.trim(),
        estadoCiudad: formData.estadoCiudad.trim(),
        telefono: formData.telefono.trim(),
        correo: formData.correo.trim(),
        codigoCobeca: formData.hasCobecaCode ? formData.codigoCobeca.trim() : 'No posee',
        sistemaActual: formData.sistemaActual.trim(),
        comentarios: formData.comentarios.trim(),
        latitud: coords ? coords.lat : undefined,
        longitud: coords ? coords.lng : undefined,
      };

      const res = await fetch('/api/solicitudes-instalacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo procesar la solicitud.');
      }

      setStatus('success');
      setFormData(INITIAL_STATE);
      setCoords(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-3xl bg-white/95 p-8 text-center text-slate-800 shadow-2xl backdrop-blur-xl border border-emerald-100 animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
          <CheckCircle2 size={36} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">¡Solicitud Registrada con Éxito!</h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
          Hemos recibido los datos de tu farmacia. Nuestro equipo comercial y técnico de <strong>SITCO</strong> se comunicará contigo a la brevedad para coordinar la demostración e instalación de <strong>Smart Pharma</strong>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="rounded-xl border border-slate-200 px-6 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Registrar otra farmacia
          </button>
          <a
            href="https://wa.me/584246299954?text=Hola,%20acabo%20de%20registrar%20una%20solicitud%20de%20instalación%20para%20Smart%20Pharma"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7bc143] px-6 py-2.5 text-xs font-black text-white hover:bg-[#6aad3a] transition-all shadow-md shadow-[#7bc143]/20"
          >
            <span>Escribir por WhatsApp ahora</span>
          </a>
        </div>
      </div>
    );
  }

  const disabled = status === 'submitting';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {status === 'error' && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Fila 1: Nombre del contacto y Nombre de Farmacia */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="ml-1 text-[10px] font-black uppercase tracking-wider text-white/70">
            Nombre del Contacto *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
              <User size={16} />
            </span>
            <input
              type="text"
              name="nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Lic. Juan Pérez"
              disabled={disabled}
              className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-md transition-all focus:border-[#7bc143] focus:bg-white/15 focus:ring-1 focus:ring-[#7bc143]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1 text-[10px] font-black uppercase tracking-wider text-white/70">
            Nombre de la Farmacia *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
              <Building2 size={16} />
            </span>
            <input
              type="text"
              name="nombreFarmacia"
              required
              value={formData.nombreFarmacia}
              onChange={handleChange}
              placeholder="Ej: Farmacia San Rafael, C.A"
              disabled={disabled}
              className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-md transition-all focus:border-[#7bc143] focus:bg-white/15 focus:ring-1 focus:ring-[#7bc143]"
            />
          </div>
        </div>
      </div>

      {/* Fila 2: Teléfono / WhatsApp y Correo */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="ml-1 text-[10px] font-black uppercase tracking-wider text-white/70">
            Teléfono o WhatsApp *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
              <Phone size={16} />
            </span>
            <input
              type="tel"
              name="telefono"
              required
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Ej: 0414-1234567 o 0424-6299954"
              disabled={disabled}
              className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-md transition-all focus:border-[#7bc143] focus:bg-white/15 focus:ring-1 focus:ring-[#7bc143]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1 text-[10px] font-black uppercase tracking-wider text-white/70">
            Correo Electrónico (Opcional)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
              <Mail size={16} />
            </span>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="ejemplo@farmacia.com"
              disabled={disabled}
              className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-md transition-all focus:border-[#7bc143] focus:bg-white/15 focus:ring-1 focus:ring-[#7bc143]"
            />
          </div>
        </div>
      </div>

      {/* Fila 3: Código COBECA Toggle & Input */}
      <div className="rounded-2xl border border-white/15 bg-white/5 p-3.5 backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            ¿Tu farmacia es cliente de Droguerías COBECA?
          </label>
          <div className="flex rounded-lg bg-black/20 p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, hasCobecaCode: false, codigoCobeca: '' }))}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                !formData.hasCobecaCode ? 'bg-white text-slate-900 shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, hasCobecaCode: true }))}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                formData.hasCobecaCode ? 'bg-[#7bc143] text-white shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              Sí poseo código
            </button>
          </div>
        </div>

        {formData.hasCobecaCode && (
          <div className="pt-2 border-t border-white/10 flex flex-col gap-1 animate-in fade-in duration-200">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#7bc143]">
              Código de Farmacia COBECA
            </label>
            <input
              type="text"
              name="codigoCobeca"
              value={formData.codigoCobeca}
              onChange={handleChange}
              placeholder="Ej: F12345"
              disabled={disabled}
              className="w-full rounded-xl border border-[#7bc143]/40 bg-white/10 px-4 py-2 text-sm text-white font-mono font-bold placeholder:text-white/35 outline-none focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]"
            />
          </div>
        )}
      </div>

      {/* Fila 4: Estado / Ciudad y Sistema Actual */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="ml-1 text-[10px] font-black uppercase tracking-wider text-white/70">
            Estado y Ciudad *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
              <MapPin size={16} />
            </span>
            <input
              type="text"
              name="estadoCiudad"
              required
              value={formData.estadoCiudad}
              onChange={handleChange}
              placeholder="Ej: Zulia, Maracaibo"
              disabled={disabled}
              className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-md transition-all focus:border-[#7bc143] focus:bg-white/15 focus:ring-1 focus:ring-[#7bc143]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1 text-[10px] font-black uppercase tracking-wider text-white/70">
            Sistema Actual (Si posee)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
              <Layers size={16} />
            </span>
            <input
              type="text"
              name="sistemaActual"
              value={formData.sistemaActual}
              onChange={handleChange}
              placeholder="Ej: Valery, Saint, Profit, Ninguno"
              disabled={disabled}
              className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-md transition-all focus:border-[#7bc143] focus:bg-white/15 focus:ring-1 focus:ring-[#7bc143]"
            />
          </div>
        </div>
      </div>

      {/* Fila 5: Dirección Física y Botón GPS */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between ml-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-white/70">
            Dirección Física de la Farmacia *
          </label>
          <button
            type="button"
            onClick={handleCaptureGPS}
            disabled={capturingGps || disabled}
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
              coords
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20 hover:text-white'
            }`}
          >
            {capturingGps ? (
              <RefreshCw size={12} className="animate-spin text-[#7bc143]" />
            ) : (
              <Navigation size={12} className={coords ? 'text-emerald-400' : 'text-[#7bc143]'} />
            )}
            <span>{capturingGps ? 'Obteniendo GPS...' : coords ? '✓ GPS Capturado' : '📍 Usar mi ubicación actual'}</span>
          </button>
        </div>
        <textarea
          name="direccion"
          required
          rows={2}
          value={formData.direccion}
          onChange={handleChange}
          placeholder="Av., Calle, Local, Centro Comercial, Punto de referencia..."
          disabled={disabled}
          className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-md resize-none transition-all focus:border-[#7bc143] focus:bg-white/15 focus:ring-1 focus:ring-[#7bc143]"
        />

        {coords && (
          <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[11px] text-emerald-300 animate-in fade-in duration-200">
            <span className="flex items-center gap-1.5 font-mono">
              <MapPin size={13} className="text-emerald-400" />
              GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} {coords.accuracy ? `(±${Math.round(coords.accuracy)}m)` : ''}
            </span>
            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white font-bold"
              >
                Ver mapa
              </a>
              <button
                type="button"
                onClick={() => setCoords(null)}
                className="text-white/50 hover:text-white text-xs px-1"
                title="Quitar coordenadas"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {gpsError && (
          <p className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/25 px-3 py-1 rounded-xl">
            {gpsError}
          </p>
        )}
      </div>

      {/* Fila 6: Comentarios Opcionales */}
      <div className="flex flex-col gap-1">
        <label className="ml-1 text-[10px] font-black uppercase tracking-wider text-white/70">
          Detalles Adicionales (Opcional)
        </label>
        <input
          type="text"
          name="comentarios"
          value={formData.comentarios}
          onChange={handleChange}
          placeholder="Ej: Requiero instalación en 3 cajas y servidor"
          disabled={disabled}
          className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-md transition-all focus:border-[#7bc143] focus:bg-white/15 focus:ring-1 focus:ring-[#7bc143]"
        />
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#7bc143] py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-[#7bc143]/30 transition-all hover:bg-[#6aad3a] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            <span>Enviando solicitud...</span>
          </>
        ) : (
          <>
            <span>Solicitar Instalación de Smart Pharma</span>
            <Send size={16} className="transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-white/50">
        Tus datos serán tratados de forma confidencial por el equipo de SITCO - Grupo COBECA.
      </p>
    </form>
  );
}
