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
    const esAgenteRetencion = optionalString(form.get('esAgenteRetencion'));
    const tasaBcv = optionalString(form.get('tasaBcv'));
    const moneda = optionalString(form.get('moneda')) || 'Bs.';

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

    const comprobanteName = comprobanteEntry.name || 'comprobante_pago';
    const comprobanteBytes = Buffer.from(await comprobanteEntry.arrayBuffer());
    const comprobanteBase64 = comprobanteBytes.toString('base64');

    const attachments: Array<{ filename: string; content: string; contentType: string }> = [
      {
        filename: comprobanteName,
        content: comprobanteBase64,
        contentType: comprobanteEntry.type,
      },
    ];

    // Opcional: Comprobante de Retención de IVA
    const comprobanteRetencionEntry = form.get('comprobanteRetencion');
    let comprobanteRetencionName = '';
    if (comprobanteRetencionEntry instanceof File && comprobanteRetencionEntry.size > 0) {
      if (comprobanteRetencionEntry.size > MAX_FILE_SIZE_BYTES) {
        return Response.json({ ok: false, error: 'El comprobante de retención excede el máximo permitido (5 MB).' }, { status: 400 });
      }
      if (!ACCEPTED_MIME_TYPES.has(comprobanteRetencionEntry.type)) {
        return Response.json({ ok: false, error: 'Tipo de comprobante de retención no permitido. Usa PDF, JPG o PNG.' }, { status: 400 });
      }
      comprobanteRetencionName = comprobanteRetencionEntry.name || 'comprobante_retencion_iva';
      const retBytes = Buffer.from(await comprobanteRetencionEntry.arrayBuffer());
      attachments.push({
        filename: comprobanteRetencionName,
        content: retBytes.toString('base64'),
        contentType: comprobanteRetencionEntry.type,
      });
    }

    const to = process.env.FINANCE_EMAIL_TO || 'pagossitco@cobeca.com';
    const from = envOrThrow('RESEND_FROM');
    const apiKey = envOrThrow('RESEND_API_KEY');

    const resend = new Resend(apiKey);

    const subject = `Reporte de pago renovación licencia – ${codigoFarmacia}`;
    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.5; color: #1e293b;">
        <h2 style="color: #1d71b8;">Reporte de pago (Renovación de Licencia)</h2>
        <p>Se ha recibido un nuevo reporte de pago a través del portal SITCO:</p>
        <table style="width: 100%; max-width: 600px; border-collapse: collapse; margin-top: 15px;">
          <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 12px; font-weight: bold; width: 40%;">Código Farmacia:</td>
            <td style="padding: 8px 12px;">${escapeHtml(codigoFarmacia)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 12px; font-weight: bold;">Razón Social:</td>
            <td style="padding: 8px 12px;">${escapeHtml(razonSocial)}</td>
          </tr>
          <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 12px; font-weight: bold;">Motivo del Pago:</td>
            <td style="padding: 8px 12px;">${escapeHtml(motivoPago)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 12px; font-weight: bold;">Monto Pagado:</td>
            <td style="padding: 8px 12px; font-size: 16px; font-weight: bold; color: #7bc143;">${escapeHtml(monto.toFixed(2))} ${escapeHtml(moneda)}</td>
          </tr>
          <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 12px; font-weight: bold;">¿Agente de Retención (75% IVA)?:</td>
            <td style="padding: 8px 12px;">${esAgenteRetencion ? escapeHtml(esAgenteRetencion) : 'No especificado'}</td>
          </tr>
          ${tasaBcv ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 12px; font-weight: bold;">Tasa BCV de Referencia:</td>
            <td style="padding: 8px 12px;">${escapeHtml(tasaBcv)}</td>
          </tr>` : ''}
          <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 12px; font-weight: bold;">Fecha del Pago:</td>
            <td style="padding: 8px 12px;">${escapeHtml(fechaPago)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 12px; font-weight: bold;">Banco Emisor / Operación:</td>
            <td style="padding: 8px 12px;">${escapeHtml(banco)}</td>
          </tr>
          <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 12px; font-weight: bold;">Titular de la Cuenta:</td>
            <td style="padding: 8px 12px;">${escapeHtml(titularBanco)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 12px; font-weight: bold;">Número de Referencia:</td>
            <td style="padding: 8px 12px; font-family: monospace; font-weight: bold;">${escapeHtml(referencia)}</td>
          </tr>
        </table>

        <div style="margin-top: 20px; padding: 12px; background: #f1f5f9; border-radius: 8px;">
          <h4 style="margin: 0 0 8px 0; color: #334155;">Archivos Adjuntos (${attachments.length}):</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li><b>Comprobante de Pago:</b> ${escapeHtml(comprobanteName)}</li>
            ${comprobanteRetencionName ? `<li><b>Comprobante de Retención IVA:</b> ${escapeHtml(comprobanteRetencionName)}</li>` : ''}
          </ul>
        </div>
      </div>
    `;

    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      attachments,
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

    return Response.json({ ok: true, message: 'Reporte enviado con éxito. Finanzas procesará el comprobante.' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return Response.json({ ok: false, error: msg }, { status: 400 });
  }
}

