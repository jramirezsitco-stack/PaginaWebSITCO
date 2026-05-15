'use client';

import React, { useMemo, useState } from 'react';

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function PaymentReportForm() {
  const [fields, setFields] = useState({
    codigoFarmacia: '',
    razonSocial: '',
    motivoPago: '',
    montoPagado: '',
    fechaPago: '',
    banco: '',
    titularBanco: '',
    referencia: '',
  });

  const [comprobante, setComprobante] = useState<File | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });

  const clientFileError = useMemo(() => {
    if (!comprobante) return null;
    if (comprobante.size > MAX_FILE_SIZE_BYTES) {
      return `El comprobante excede el máximo permitido (${formatBytes(MAX_FILE_SIZE_BYTES)}).`;
    }
    if (!ACCEPTED_MIME_TYPES.includes(comprobante.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
      return 'Tipo de archivo no permitido. Usa PDF, JPG o PNG.';
    }
    return null;
  }, [comprobante]);

  const onChangeField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFields({
      codigoFarmacia: '',
      razonSocial: '',
      motivoPago: '',
      montoPagado: '',
      fechaPago: '',
      banco: '',
      titularBanco: '',
      referencia: '',
    });
    setComprobante(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState({ status: 'submitting' });

    try {
      if (!comprobante) {
        setSubmitState({ status: 'error', message: 'Debes adjuntar el comprobante de pago.' });
        return;
      }
      if (clientFileError) {
        setSubmitState({ status: 'error', message: clientFileError });
        return;
      }

      const fd = new FormData();
      fd.append('codigoFarmacia', fields.codigoFarmacia.trim());
      fd.append('razonSocial', fields.razonSocial.trim());
      fd.append('motivoPago', fields.motivoPago.trim());
      fd.append('montoPagado', fields.montoPagado.trim());
      fd.append('fechaPago', fields.fechaPago);
      fd.append('banco', fields.banco.trim());
      fd.append('titularBanco', fields.titularBanco.trim());
      fd.append('referencia', fields.referencia.trim());
      fd.append('comprobante', comprobante);

      const res = await fetch('/api/reportes-pago', { method: 'POST', body: fd });
      const payload = (await res.json().catch(() => null)) as
        | { ok: true; message: string }
        | { ok: false; error: string }
        | null;

      if (!res.ok || !payload || payload.ok !== true) {
        const msg = payload && 'error' in payload ? payload.error : 'No se pudo enviar el reporte. Intenta nuevamente.';
        setSubmitState({ status: 'error', message: msg });
        return;
      }

      setSubmitState({ status: 'success', message: payload.message });
      resetForm();
    } catch {
      setSubmitState({ status: 'error', message: 'Ocurrió un error inesperado enviando el reporte.' });
    }
  };

  const disabled = submitState.status === 'submitting';

  return (
    <form onSubmit={onSubmit} className="space-y-2 md:space-y-2.5">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
          <div className="flex flex-col gap-1">
            <label className="ml-1 text-[9px] font-black uppercase tracking-wide text-slate-500">
              Código de la Farmacia
            </label>
            <input
              type="text"
              name="codigoFarmacia"
              required
              value={fields.codigoFarmacia}
              onChange={onChangeField}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]/30"
              placeholder="Ej: F12345"
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="ml-1 text-[9px] font-black uppercase tracking-wide text-slate-500">Razón Social</label>
            <input
              type="text"
              name="razonSocial"
              required
              value={fields.razonSocial}
              onChange={onChangeField}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]/30"
              placeholder="Razón social de la farmacia"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1 text-[9px] font-black uppercase tracking-wide text-slate-500">Motivo del pago</label>
          <input
            type="text"
            name="motivoPago"
            required
            value={fields.motivoPago}
            onChange={onChangeField}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]/30"
            placeholder="Ej: Renovación licencia de uso"
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
          <div className="flex flex-col gap-1">
            <label className="ml-1 text-[9px] font-black uppercase tracking-wide text-slate-500">Monto pagado</label>
            <input
              type="number"
              name="montoPagado"
              required
              inputMode="decimal"
              min="0"
              step="0.01"
              value={fields.montoPagado}
              onChange={onChangeField}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]/30"
              placeholder="Ej: 100.00"
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="ml-1 text-[9px] font-black uppercase tracking-wide text-slate-500">Fecha del pago</label>
            <input
              type="date"
              name="fechaPago"
              required
              value={fields.fechaPago}
              onChange={onChangeField}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]/30"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
          <div className="flex flex-col gap-1">
            <label className="ml-1 text-[9px] font-black uppercase tracking-wide text-slate-500">Banco</label>
            <input
              type="text"
              name="banco"
              required
              value={fields.banco}
              onChange={onChangeField}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]/30"
              placeholder="Ej: Banco X"
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="ml-1 text-[9px] font-black uppercase tracking-wide text-slate-500">Titular del banco</label>
            <input
              type="text"
              name="titularBanco"
              required
              value={fields.titularBanco}
              onChange={onChangeField}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]/30"
              placeholder="Nombre del titular"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1 text-[9px] font-black uppercase tracking-wide text-slate-500">Referencia</label>
          <input
            type="text"
            name="referencia"
            required
            value={fields.referencia}
            onChange={onChangeField}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]/30"
            placeholder="Referencia / Nº de operación"
            disabled={disabled}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1 text-[9px] font-black uppercase tracking-wide text-slate-500">
            Comprobante de pago (máx. 5 MB)
          </label>
          <input
            type="file"
            name="comprobante"
            required
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-800 transition-all hover:file:bg-slate-200"
            disabled={disabled}
          />
          <p className="text-[11px] text-slate-500">
            Tipos permitidos: PDF, JPG, PNG. Tamaño máximo: {formatBytes(MAX_FILE_SIZE_BYTES)}.
          </p>
        </div>

        {submitState.status === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 md:text-sm">
            {submitState.message}
          </div>
        )}
        {submitState.status === 'success' && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 md:text-sm">
            {submitState.message}
          </div>
        )}

        <button
          type="submit"
          className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#7bc143] py-2.5 text-sm font-black text-white shadow-lg shadow-[#7bc143]/25 transition-all hover:bg-[#6aad3a] disabled:cursor-not-allowed disabled:opacity-60 md:py-3"
          disabled={disabled}
        >
          {submitState.status === 'submitting' ? 'Enviando…' : 'Enviar reporte de pago'}
        </button>
    </form>
  );
}

