import { Resend } from 'resend';

export const runtime = 'nodejs';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

function requiredString(v: FormDataEntryValue | null, field: string) {
  if (typeof v !== 'string') throw new Error(`Campo inválido: ${field}`);
  const trimmed = v.trim();
  if (!trimmed) throw new Error(`Campo requerido: ${field}`);
  return trimmed;
}

function optionalString(v: FormDataEntryValue | null) {
  if (v == null) return '';
  if (typeof v !== 'string') return '';
  return v.trim();
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function envOrThrow(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`Falta variable de entorno: ${key}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const codigoFarmacia = requiredString(form.get('codigoFarmacia'), 'codigoFarmacia');
    const razonSocial = requiredString(form.get('razonSocial'), 'razonSocial');
    const motivoPago = requiredString(form.get('motivoPago'), 'motivoPago');
    const montoPagadoRaw = requiredString(form.get('montoPagado'), 'montoPagado');
    const fechaPago = requiredString(form.get('fechaPago'), 'fechaPago');
    const banco = requiredString(form.get('banco'), 'banco');
    const titularBanco = requiredString(form.get('titularBanco'), 'titularBanco');
    const referencia = requiredString(form.get('referencia'), 'referencia');

    const monto = Number(montoPagadoRaw.replace(',', '.'));
    if (!Number.isFinite(monto) || monto <= 0) {
      return Response.json({ ok: false, error: 'El monto pagado debe ser mayor a 0.' }, { status: 400 });
    }

    const comprobanteEntry = form.get('comprobante');
    if (!(comprobanteEntry instanceof File)) {
      return Response.json({ ok: false, error: 'Debes adjuntar el comprobante de pago.' }, { status: 400 });
    }

    if (comprobanteEntry.size <= 0) {
      return Response.json({ ok: false, error: 'El comprobante está vacío.' }, { status: 400 });
    }
    if (comprobanteEntry.size > MAX_FILE_SIZE_BYTES) {
      return Response.json({ ok: false, error: 'El comprobante excede el máximo permitido (5 MB).' }, { status: 400 });
    }
    if (!ACCEPTED_MIME_TYPES.has(comprobanteEntry.type)) {
      return Response.json({ ok: false, error: 'Tipo de comprobante no permitido. Usa PDF, JPG o PNG.' }, { status: 400 });
    }

    const comprobanteName = comprobanteEntry.name || 'comprobante';
    const comprobanteBytes = Buffer.from(await comprobanteEntry.arrayBuffer());
    const comprobanteBase64 = comprobanteBytes.toString('base64');

    const to = process.env.FINANCE_EMAIL_TO || 'pagossitco@cobeca.com';
    const from = envOrThrow('RESEND_FROM');
    const apiKey = envOrThrow('RESEND_API_KEY');

    const resend = new Resend(apiKey);

    const subject = `Reporte de pago renovación licencia – ${codigoFarmacia}`;
    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.5;">
        <h2>Reporte de pago (renovación de licencia)</h2>
        <p>Se ha recibido un reporte de pago con los siguientes datos:</p>
        <ul>
          <li><b>Código de la Farmacia:</b> ${escapeHtml(codigoFarmacia)}</li>
          <li><b>Razón Social:</b> ${escapeHtml(razonSocial)}</li>
          <li><b>Motivo del pago:</b> ${escapeHtml(motivoPago)}</li>
          <li><b>Monto pagado:</b> ${escapeHtml(monto.toFixed(2))}</li>
          <li><b>Fecha del pago:</b> ${escapeHtml(fechaPago)}</li>
          <li><b>Banco:</b> ${escapeHtml(banco)}</li>
          <li><b>Titular del banco:</b> ${escapeHtml(titularBanco)}</li>
          <li><b>Referencia:</b> ${escapeHtml(referencia)}</li>
        </ul>
        <p>Comprobante adjunto: <b>${escapeHtml(comprobanteName)}</b></p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      attachments: [
        {
          filename: comprobanteName,
          content: comprobanteBase64,
          contentType: comprobanteEntry.type,
        },
      ],
      tags: [
        { name: 'app', value: 'sitco-neweb' },
        { name: 'feature', value: 'reporte-pago' },
      ],
    });

    if (error) {
      return Response.json(
        { ok: false, error: `No se pudo enviar el correo: ${error.message || 'Error desconocido'}` },
        { status: 502 },
      );
    }

    return Response.json({ ok: true, message: 'Reporte enviado. Finanzas recibirá el correo con el comprobante adjunto.' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return Response.json({ ok: false, error: msg }, { status: 400 });
  }
}

