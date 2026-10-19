'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  CreditCard,
  Copy,
  Check,
  Building2,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface BcvData {
  rate: number;
  date: string;
  source: string;
  formattedRate: string;
}

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

// Datos bancarios oficiales de SITCO / COBECA
const BANK_DETAILS = {
  bank: 'Banco Provincial',
  accountType: 'Cuenta Corriente',
  accountNumber: '0108-0944-42-0100012947',
  holder: 'Sistemas de Información Tecnológica COBECA, C.A',
  rif: 'J-40160780-2',
  email: 'pagossitco@cobeca.com',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatVes(amount: number) {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatUsd(amount: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function PaymentReportForm() {
  const [activeTab, setActiveTab] = useState<'calculadora' | 'reporte'>('calculadora');

  // Estado de la tasa BCV
  const [bcvData, setBcvData] = useState<BcvData | null>(null);
  const [loadingBcv, setLoadingBcv] = useState(true);
  const [bcvError, setBcvError] = useState<string | null>(null);

  // Estado de la calculadora
  const [licenseCount, setLicenseCount] = useState<number>(1);
  const [isRetentionAgent, setIsRetentionAgent] = useState<boolean>(true); // 75% retención por defecto
  const [retentionPercent] = useState<number>(75); // 75% del IVA

  // Estados de copiado al portapapeles
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Estado del formulario
  const [fields, setFields] = useState({
    codigoFarmacia: '',
    razonSocial: '',
    motivoPago: 'Renovación de Licencia Smart Pharma',
    montoPagado: '',
    fechaPago: new Date().toISOString().split('T')[0],
    banco: 'Banco Provincial',
    titularBanco: '',
    referencia: '',
    moneda: 'Bs.',
  });

  const [comprobante, setComprobante] = useState<File | null>(null);
  const [comprobanteRetencion, setComprobanteRetencion] = useState<File | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });

  // Consultar Tasa Oficial BCV
  const fetchBcvRate = async () => {
    setLoadingBcv(true);
    setBcvError(null);
    try {
      const res = await fetch('/api/bcv');
      const data = await res.json();
      if (res.ok && data?.ok && data?.rate) {
        setBcvData({
          rate: Number(data.rate),
          date: data.date,
          source: data.source || 'Banco Central de Venezuela',
          formattedRate: data.formattedRate || formatVes(Number(data.rate)),
        });
      } else {
        throw new Error('No se pudo obtener la tasa BCV.');
      }
    } catch {
      setBcvError('Usando tasa de referencia. Puedes verificarla con el BCV.');
      // Tasa de seguridad por si falla la red
      setBcvData({
        rate: 860.18,
        date: new Date().toISOString().split('T')[0],
        source: 'Tasa BCV de Referencia',
        formattedRate: '860,18',
      });
    } finally {
      setLoadingBcv(false);
    }
  };

  useEffect(() => {
    fetchBcvRate();
  }, []);

  // Cálculos financieros
  // Renovación base: 40$ USD + 16% IVA = 46.40$ USD
  const basePricePerLicense = 40.0;
  const ivaRate = 0.16;

  const calculation = useMemo(() => {
    const qty = Math.max(1, licenseCount || 1);
    const subtotalUSD = basePricePerLicense * qty;
    const ivaUSD = subtotalUSD * ivaRate;
    const totalWithoutRetentionUSD = subtotalUSD + ivaUSD;

    // Retención del 75% del IVA
    const retentionUSD = isRetentionAgent ? ivaUSD * (retentionPercent / 100) : 0;
    const totalToPayUSD = totalWithoutRetentionUSD - retentionUSD;

    const rate = bcvData?.rate || 0;
    const subtotalVES = subtotalUSD * rate;
    const ivaVES = ivaUSD * rate;
    const totalWithoutRetentionVES = totalWithoutRetentionUSD * rate;
    const retentionVES = retentionUSD * rate;
    const totalToPayVES = totalToPayUSD * rate;

    return {
      qty,
      subtotalUSD,
      ivaUSD,
      totalWithoutRetentionUSD,
      retentionUSD,
      totalToPayUSD,
      subtotalVES,
      ivaVES,
      totalWithoutRetentionVES,
      retentionVES,
      totalToPayVES,
    };
  }, [licenseCount, isRetentionAgent, retentionPercent, bcvData]);

  // Copiar al portapapeles con feedback
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Transferir cálculo al formulario de reporte
  const handleTransferToReport = () => {
    const montoCalculado = calculation.totalToPayVES.toFixed(2);
    setFields((prev) => ({
      ...prev,
      montoPagado: montoCalculado,
      motivoPago: `Renovación de Licencia Smart Pharma (${calculation.qty} ${calculation.qty === 1 ? 'licencia' : 'licencias'})`,
      moneda: 'Bs.',
    }));
    setActiveTab('reporte');
  };

  // Validación de archivos
  const clientFileError = useMemo(() => {
    if (comprobante) {
      if (comprobante.size > MAX_FILE_SIZE_BYTES) {
        return `El comprobante de pago excede el máximo permitido (${formatBytes(MAX_FILE_SIZE_BYTES)}).`;
      }
      if (!ACCEPTED_MIME_TYPES.includes(comprobante.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
        return 'Tipo de comprobante de pago no permitido. Usa PDF, JPG o PNG.';
      }
    }
    if (comprobanteRetencion) {
      if (comprobanteRetencion.size > MAX_FILE_SIZE_BYTES) {
        return `El comprobante de retención excede el máximo permitido (${formatBytes(MAX_FILE_SIZE_BYTES)}).`;
      }
      if (!ACCEPTED_MIME_TYPES.includes(comprobanteRetencion.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
        return 'Tipo de comprobante de retención no permitido. Usa PDF, JPG o PNG.';
      }
    }
    return null;
  }, [comprobante, comprobanteRetencion]);

  const onChangeField = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFields({
      codigoFarmacia: '',
      razonSocial: '',
      motivoPago: 'Renovación de Licencia Smart Pharma',
      montoPagado: '',
      fechaPago: new Date().toISOString().split('T')[0],
      banco: 'Banco Provincial',
      titularBanco: '',
      referencia: '',
      moneda: 'Bs.',
    });
    setComprobante(null);
    setComprobanteRetencion(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState({ status: 'submitting' });

    try {
      if (!comprobante) {
        setSubmitState({ status: 'error', message: 'Debes adjuntar el comprobante de transferencia bancaria.' });
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
      fd.append('moneda', fields.moneda);
      fd.append('fechaPago', fields.fechaPago);
      fd.append('banco', fields.banco.trim());
      fd.append('titularBanco', fields.titularBanco.trim());
      fd.append('referencia', fields.referencia.trim());
      fd.append('esAgenteRetencion', isRetentionAgent ? 'Sí (75% IVA retenido)' : 'No');
      if (bcvData?.rate) {
        fd.append('tasaBcv', `${bcvData.formattedRate} Bs./USD`);
      }
      fd.append('comprobante', comprobante);

      if (comprobanteRetencion) {
        fd.append('comprobanteRetencion', comprobanteRetencion);
      }

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
    <div className="flex flex-col gap-4 text-slate-800">
      {/* Selector de pestañas */}
      <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('calculadora')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'calculadora'
              ? 'bg-white text-[#1d71b8] shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          <Calculator size={16} />
          <span>1. Calculadora & Cuentas</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reporte')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'reporte'
              ? 'bg-white text-[#7bc143] shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          <CreditCard size={16} />
          <span>2. Reportar Pago</span>
        </button>
      </div>

      {/* PESTAÑA 1: CALCULADORA Y DATOS BANCARIOS */}
      {activeTab === 'calculadora' && (
        <div className="space-y-4">
          {/* Tarjeta de Tasa Oficial BCV */}
          <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-blue-50 to-emerald-50 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <TrendingUp size={16} />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                      Tasa Oficial BCV
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                      Actualizada
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {loadingBcv
                      ? 'Consultando tasa oficial...'
                      : bcvData?.date
                        ? `Fecha: ${bcvData.date.split('T')[0]}`
                        : 'Banco Central de Venezuela'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-right">
                <div>
                  <span className="text-xl md:text-2xl font-black text-slate-900">
                    {loadingBcv ? '...' : `${bcvData?.formattedRate || '0.00'} Bs.`}
                  </span>
                  <p className="text-[10px] text-slate-500 font-medium">por 1.00 USD</p>
                </div>
                <button
                  type="button"
                  onClick={fetchBcvRate}
                  disabled={loadingBcv}
                  title="Actualizar tasa"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 transition-colors"
                >
                  <RefreshCw size={14} className={loadingBcv ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {bcvError && (
              <p className="mt-2 text-[10px] text-amber-700 bg-amber-50 rounded px-2 py-1">
                {bcvError}
              </p>
            )}
          </div>

          {/* Calculadora de Renovación */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-1.5">
                  <ShieldCheck size={18} className="text-[#7bc143]" />
                  Renovación de Licencia Smart Pharma
                </h4>
                <p className="text-xs text-slate-500">
                  Tarifa bimestral: <span className="font-bold text-slate-800">$40.00</span> + 16% IVA (<span className="font-bold text-slate-800">$6.40</span>) = <span className="font-bold text-slate-800">$46.40 USD</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Licencias:</label>
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setLicenseCount((prev) => Math.max(1, prev - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-white font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-black text-slate-900">{licenseCount}</span>
                  <button
                    type="button"
                    onClick={() => setLicenseCount((prev) => prev + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Switch Agente de Retención */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRetentionAgent}
                  onChange={(e) => setIsRetentionAgent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#7bc143] focus:ring-[#7bc143]"
                />
                <div className="min-w-0">
                  <span className="text-xs md:text-sm font-black text-emerald-950 block">
                    ¿La farmacia es Agente de Retención de IVA? (75%)
                  </span>
                  <p className="text-[11px] text-emerald-800 font-light mt-0.5 leading-snug">
                    Aplica la deducción del 75% del IVA ({formatUsd(calculation.retentionUSD)} USD) que debes enterar al SENIAT con tu comprobante.
                  </p>
                </div>
              </label>
            </div>

            {/* Desglose Matemático */}
            <div className="rounded-xl bg-slate-50 p-3 space-y-2 text-xs border border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Base Imponible ({calculation.qty} {calculation.qty === 1 ? 'licencia' : 'licencias'} × $40):</span>
                <span className="font-semibold text-slate-800">
                  ${formatUsd(calculation.subtotalUSD)} USD / {formatVes(calculation.subtotalVES)} Bs.
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA 16%:</span>
                <span className="font-semibold text-slate-800">
                  +${formatUsd(calculation.ivaUSD)} USD / +{formatVes(calculation.ivaVES)} Bs.
                </span>
              </div>
              {isRetentionAgent && (
                <div className="flex justify-between text-emerald-700 bg-emerald-100/60 -mx-1 px-1 py-0.5 rounded font-medium">
                  <span>Retención de IVA (75% a tu favor):</span>
                  <span>
                    -${formatUsd(calculation.retentionUSD)} USD / -{formatVes(calculation.retentionVES)} Bs.
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Total Neto a Transferir:
                  </span>
                  {isRetentionAgent && (
                    <span className="block text-[10px] text-slate-500">
                      (Base + 25% IVA remanente)
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 mr-2">
                    ${formatUsd(calculation.totalToPayUSD)} USD
                  </span>
                  <span className="text-lg md:text-xl font-black text-[#1d71b8]">
                    {formatVes(calculation.totalToPayVES)} Bs.
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopy(calculation.totalToPayVES.toFixed(2), 'monto')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
              >
                {copiedField === 'monto' ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-700">¡Monto copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar monto en Bs.</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleTransferToReport}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#7bc143] py-2 px-4 text-xs font-black text-white hover:bg-[#6aad3a] transition-all shadow-md shadow-[#7bc143]/20"
              >
                <span>Usar este monto y Reportar</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Tarjeta de Cuenta Bancaria Oficial */}
          <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#7bc143]" />
                <h4 className="font-black text-sm md:text-base tracking-wide">
                  Cuenta Bancaria Oficial para Pagos
                </h4>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-slate-300">
                Única cuenta autorizada
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-slate-400">Banco:</span>
                <span className="font-bold">{BANK_DETAILS.bank} ({BANK_DETAILS.accountType})</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-slate-400">Beneficiario:</span>
                <span className="font-medium text-right text-[11px] md:text-xs">{BANK_DETAILS.holder}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-slate-400">RIF:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{BANK_DETAILS.rif}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(BANK_DETAILS.rif, 'rif')}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Copiar RIF"
                  >
                    {copiedField === 'rif' ? <Check size={12} className="text-[#7bc143]" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400">Nº de Cuenta:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs md:text-sm text-[#7bc143]">
                    {BANK_DETAILS.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(BANK_DETAILS.accountNumber, 'cuenta')}
                    className="p-1 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
                    title="Copiar Número de Cuenta"
                  >
                    {copiedField === 'cuenta' ? <Check size={13} className="text-[#7bc143]" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: FORMULARIO DE REPORTE */}
      {activeTab === 'reporte' && (
        <form onSubmit={onSubmit} className="space-y-3">
          {/* Alerta recordatorio si es agente de retención */}
          {isRetentionAgent && (
            <div className="flex items-start gap-2 rounded-xl bg-sky-50 border border-sky-100 p-2.5 text-xs text-sky-900">
              <AlertCircle size={16} className="text-sky-600 shrink-0 mt-0.5" />
              <p>
                <strong>Atención Agente de Retención:</strong> Recuerda adjuntar tanto el comprobante de la transferencia bancaria como el comprobante de retención de IVA (75%).
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Código de la Farmacia *
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
              <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Razón Social *
              </label>
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
            <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
              Motivo del pago *
            </label>
            <input
              type="text"
              name="motivoPago"
              required
              value={fields.motivoPago}
              onChange={onChangeField}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]/30"
              placeholder="Ej: Renovación licencia de uso Smart Pharma"
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Monto pagado *
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Moneda: {fields.moneda}</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  name="montoPagado"
                  required
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={fields.montoPagado}
                  onChange={onChangeField}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 font-bold outline-none transition-all placeholder:text-slate-400 focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]/30"
                  placeholder="Ej: 35783.37"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Fecha del pago *
              </label>
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

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Banco Emisor *
              </label>
              <input
                type="text"
                name="banco"
                required
                value={fields.banco}
                onChange={onChangeField}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]/30"
                placeholder="Ej: Banco Provincial, Banesco, etc."
                disabled={disabled}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Titular de la cuenta emisora *
              </label>
              <input
                type="text"
                name="titularBanco"
                required
                value={fields.titularBanco}
                onChange={onChangeField}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]/30"
                placeholder="Nombre de quien transfiere"
                disabled={disabled}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">
              Número de Referencia de la Transferencia *
            </label>
            <input
              type="text"
              name="referencia"
              required
              value={fields.referencia}
              onChange={onChangeField}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 font-mono font-bold outline-none transition-all placeholder:text-slate-400 focus:border-[#7bc143] focus:ring-1 focus:ring-[#7bc143]/30"
              placeholder="Número de confirmación / operación"
              disabled={disabled}
            />
          </div>

          {/* Adjunto 1: Comprobante de pago bancario */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText size={15} className="text-[#1d71b8]" />
              1. Comprobante de Transferencia Bancaria (Obligatorio) *
            </label>
            <input
              type="file"
              name="comprobante"
              required
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-800 file:shadow-sm hover:file:bg-slate-100 transition-all"
              disabled={disabled}
            />
            <p className="text-[10px] text-slate-500">
              PDF, JPG o PNG. Tamaño máximo: 5 MB.
            </p>
          </div>

          {/* Adjunto 2: Comprobante de Retención de IVA (si aplica) */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText size={15} className="text-[#7bc143]" />
                2. Comprobante de Retención de IVA (Si eres Agente de Retención)
              </label>
              {isRetentionAgent && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Requerido 75%
                </span>
              )}
            </div>
            <input
              type="file"
              name="comprobanteRetencion"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(e) => setComprobanteRetencion(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-800 file:shadow-sm hover:file:bg-slate-100 transition-all"
              disabled={disabled}
            />
            <p className="text-[10px] text-slate-500">
              Adjunta el comprobante emitido por tu sistema contable / SENIAT con el 75% retenido.
            </p>
          </div>

          {submitState.status === 'error' && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{submitState.message}</span>
            </div>
          )}

          {submitState.status === 'success' && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold">¡Reporte enviado exitosamente!</p>
                <p className="text-[11px] text-emerald-800 mt-0.5">{submitState.message}</p>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('calculadora')}
              className="sm:w-1/3 rounded-lg border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Volver a la calculadora
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#7bc143] py-2.5 text-sm font-black text-white shadow-lg shadow-[#7bc143]/25 transition-all hover:bg-[#6aad3a] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled}
            >
              {submitState.status === 'submitting' ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Enviando reporte...</span>
                </>
              ) : (
                <span>Enviar reporte de pago</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
