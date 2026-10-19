import { Resend } from 'resend';
import { getSupabase, SolicitudInstalacion } from '@/lib/supabase';
import { getLocalSolicitudes, saveLocalSolicitud, updateLocalSolicitud } from '@/lib/storageFallback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const ADMIN_SECRET = process.env.ADMIN_ACCESS_CODE || 'sitco2026';

// GET: Obtener todas las solicitudes registradas (para el panel admin)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const keyParam = searchParams.get('adminKey') || '';

    const providedKey = authHeader || keyParam;
    if (providedKey !== ADMIN_SECRET) {
      return Response.json({ ok: false, error: 'No autorizado. Clave de acceso incorrecta.' }, { status: 401 });
    }

    const noCacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    };

    // 1. Intentar con Supabase si está configurado
    const client = getSupabase();
    if (client) {
      const { data, error } = await client
        .from('solicitudes_instalacion')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error consultando Supabase, usando respaldo local:', error);
      } else if (data) {
        // Enlazar notas y coordenadas locales si aún no existen en la columna de Supabase
        const localData = getLocalSolicitudes();
        const localMap = new Map(localData.map((item) => [item.id, item]));
        const mergedData = data.map((item: SolicitudInstalacion) => {
          const localItem = localMap.get(item.id);
          return {
            ...item,
            notas: item.notas !== undefined && item.notas !== null ? item.notas : (localItem?.notas || ''),
            latitud: item.latitud !== undefined && item.latitud !== null ? item.latitud : localItem?.latitud,
            longitud: item.longitud !== undefined && item.longitud !== null ? item.longitud : localItem?.longitud,
          };
        });
        return Response.json({ ok: true, data: mergedData, source: 'supabase' }, { headers: noCacheHeaders });
      }
    }

    // 2. Respaldo local
    const localData = getLocalSolicitudes();
    return Response.json({ ok: true, data: localData, source: 'local' }, { headers: noCacheHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al obtener solicitudes';
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}

// POST: Registrar nueva solicitud de instalación
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nombre = String(body.nombre || '').trim();
    const nombreFarmacia = String(body.nombreFarmacia || '').trim();
    const direccion = String(body.direccion || '').trim();
    const estadoCiudad = String(body.estadoCiudad || '').trim();
    const telefono = String(body.telefono || '').trim();
    const correo = String(body.correo || '').trim();
    const codigoCobeca = String(body.codigoCobeca || '').trim();
    const sistemaActual = String(body.sistemaActual || '').trim();
    const comentarios = String(body.comentarios || '').trim();

    if (!nombre) {
      return Response.json({ ok: false, error: 'El nombre del contacto es obligatorio.' }, { status: 400 });
    }
    if (!nombreFarmacia) {
      return Response.json({ ok: false, error: 'El nombre de la farmacia es obligatorio.' }, { status: 400 });
    }
    if (!telefono) {
      return Response.json({ ok: false, error: 'El número de teléfono o WhatsApp es obligatorio.' }, { status: 400 });
    }
    if (!direccion) {
      return Response.json({ ok: false, error: 'La dirección de la farmacia es obligatoria.' }, { status: 400 });
    }

    const latitudRaw = body.latitud;
    const longitudRaw = body.longitud;
    const latitud = typeof latitudRaw === 'number' ? latitudRaw : (latitudRaw ? parseFloat(String(latitudRaw)) : undefined);
    const longitud = typeof longitudRaw === 'number' ? longitudRaw : (longitudRaw ? parseFloat(String(longitudRaw)) : undefined);
    const hasCoordinates = typeof latitud === 'number' && !isNaN(latitud) && typeof longitud === 'number' && !isNaN(longitud);

    let savedRecord: SolicitudInstalacion | null = null;

    // 1. Guardar en Supabase si está disponible
    const client = getSupabase();
    if (client) {
      const insertPayload: Record<string, unknown> = {
        nombre,
        nombre_farmacia: nombreFarmacia,
        direccion,
        estado_ciudad: estadoCiudad,
        telefono,
        correo: correo || null,
        codigo_cobeca: codigoCobeca || null,
        sistema_actual: sistemaActual || null,
        comentarios: comentarios || null,
        estatus: 'nuevo',
      };
      if (hasCoordinates) {
        insertPayload.latitud = latitud;
        insertPayload.longitud = longitud;
      }

      let { data, error } = await client
        .from('solicitudes_instalacion')
        .insert([insertPayload])
        .select()
        .single();

      // Si falló por falta de columnas latitud/longitud (PGRST204), reintentar sin ellas
      if (error && error.code === 'PGRST204' && hasCoordinates) {
        delete insertPayload.latitud;
        delete insertPayload.longitud;
        const retryResult = await client
          .from('solicitudes_instalacion')
          .insert([insertPayload])
          .select()
          .single();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error('Error insertando en Supabase, guardando en respaldo local:', error);
      } else if (data) {
        savedRecord = data as SolicitudInstalacion;
        // Si las coordenadas no se pudieron insertar en Supabase por columnas faltantes, guardarlas localmente
        if (hasCoordinates) {
          savedRecord.latitud = latitud;
          savedRecord.longitud = longitud;
          updateLocalSolicitud(savedRecord.id, { latitud, longitud });
        }
      }
    }

    // 2. Si no hay Supabase o falló, guardar en respaldo local
    if (!savedRecord) {
      savedRecord = saveLocalSolicitud({
        nombre,
        nombre_farmacia: nombreFarmacia,
        direccion,
        estado_ciudad: estadoCiudad,
        telefono,
        correo,
        codigo_cobeca: codigoCobeca,
        sistema_actual: sistemaActual,
        comentarios,
        latitud: hasCoordinates ? latitud : undefined,
        longitud: hasCoordinates ? longitud : undefined,
        estatus: 'nuevo',
      });
    }

    // 3. Enviar notificación por correo con Resend si está configurado
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    const toEmail = process.env.FINANCE_EMAIL_TO || 'atcsitco@cobeca.com';

    if (apiKey && from) {
      try {
        const resend = new Resend(apiKey);
        const cleanPhone = telefono.replace(/\D/g, '');
        const whatsappLink = `https://wa.me/${cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone}`}`;

        const html = `
          <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.6; color: #1e293b;">
            <div style="background: linear-gradient(135deg, #1d71b8, #1877F2); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
              <h2 style="margin: 0; font-size: 20px;">Nueva Solicitud de Instalación: Smart Pharma</h2>
              <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">Registrado a través del portal web de SITCO</p>
            </div>
            
            <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: bold; width: 35%; color: #64748b;">Nombre del Contacto:</td>
                  <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${escapeHtml(nombre)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: bold; color: #64748b;">Nombre de la Farmacia:</td>
                  <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${escapeHtml(nombreFarmacia)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: bold; color: #64748b;">Teléfono / WhatsApp:</td>
                  <td style="padding: 10px 0;">
                    <a href="${whatsappLink}" target="_blank" style="color: #25D366; font-weight: bold; text-decoration: none;">
                      ${escapeHtml(telefono)} (Abrir WhatsApp)
                    </a>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: bold; color: #64748b;">Correo Electrónico:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${correo ? escapeHtml(correo) : 'No especificado'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: bold; color: #64748b;">Código Farmacia COBECA:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #7bc143;">
                    ${codigoCobeca ? escapeHtml(codigoCobeca) : 'No posee / Cliente nuevo'}
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: bold; color: #64748b;">Estado / Ciudad:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${estadoCiudad ? escapeHtml(estadoCiudad) : 'No especificado'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: bold; color: #64748b;">Dirección Física:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${escapeHtml(direccion)}</td>
                </tr>
                ${hasCoordinates ? `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: bold; color: #64748b;">Ubicación GPS:</td>
                  <td style="padding: 10px 0;">
                    <a href="https://www.google.com/maps?q=${latitud},${longitud}" target="_blank" style="color: #1d71b8; font-weight: bold; text-decoration: underline;">
                      📍 Abrir en Google Maps (${latitud?.toFixed(5)}, ${longitud?.toFixed(5)})
                    </a>
                  </td>
                </tr>
                ` : ''}
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; font-weight: bold; color: #64748b;">Sistema Actual:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${sistemaActual ? escapeHtml(sistemaActual) : 'No especificado'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #64748b; vertical-align: top;">Comentarios / Notas:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${comentarios ? escapeHtml(comentarios) : 'Sin comentarios adicionales.'}</td>
                </tr>
              </table>

              <div style="margin-top: 24px; text-align: center;">
                <a href="${whatsappLink}" target="_blank" style="display: inline-block; background-color: #25D366; color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none;">
                  Contactar al Cliente vía WhatsApp
                </a>
              </div>
            </div>
          </div>
        `;

        await resend.emails.send({
          from,
          to: [toEmail],
          subject: `Nueva Solicitud de Instalación: ${nombreFarmacia} (${nombre})`,
          html,
          tags: [
            { name: 'app', value: 'sitco-neweb' },
            { name: 'feature', value: 'solicitud-instalacion' },
          ],
        });
      } catch (emailErr) {
        console.error('Error enviando notificación por correo:', emailErr);
      }
    }

    return Response.json({
      ok: true,
      message: '¡Solicitud registrada con éxito! Nuestro equipo de atención se pondrá en contacto pronto.',
      data: savedRecord,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al procesar la solicitud';
    return Response.json({ ok: false, error: msg }, { status: 400 });
  }
}

// PATCH: Actualizar el estatus, notas o ubicación GPS de una solicitud
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const keyParam = searchParams.get('adminKey') || '';

    const providedKey = authHeader || keyParam;
    if (providedKey !== ADMIN_SECRET) {
      return Response.json({ ok: false, error: 'No autorizado. Clave de acceso incorrecta.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, estatus, notas, latitud, longitud } = body;

    if (!id) {
      return Response.json({ ok: false, error: 'Falta el parámetro id del registro.' }, { status: 400 });
    }

    if (estatus === undefined && notas === undefined && latitud === undefined && longitud === undefined) {
      return Response.json({ ok: false, error: 'Debes enviar al menos estatus, notas o coordenadas GPS para actualizar.' }, { status: 400 });
    }

    const patchData: Partial<SolicitudInstalacion> = {};
    if (estatus !== undefined) patchData.estatus = estatus;
    if (notas !== undefined) patchData.notas = String(notas).trim();
    if (latitud !== undefined) patchData.latitud = typeof latitud === 'number' ? latitud : parseFloat(String(latitud));
    if (longitud !== undefined) patchData.longitud = typeof longitud === 'number' ? longitud : parseFloat(String(longitud));

    // 1. Guardar en local siempre como respaldo y cache inmediata
    updateLocalSolicitud(id, patchData);

    const client = getSupabase();
    if (client) {
      const { error } = await client
        .from('solicitudes_instalacion')
        .update(patchData)
        .eq('id', id);

      if (!error) {
        return Response.json({ ok: true, message: 'Registro actualizado en Supabase.', source: 'supabase' });
      }

      // Si alguna columna aún no fue agregada en Supabase (error PGRST204)
      if (error.code === 'PGRST204') {
        console.warn('Algunas columnas aún no existen en Supabase. Se guardaron localmente.');
        // Si además venía estatus, actualizamos solo estatus en Supabase
        if (patchData.estatus !== undefined) {
          await client.from('solicitudes_instalacion').update({ estatus: patchData.estatus }).eq('id', id);
        }
        return Response.json({
          ok: true,
          warning: 'MISSING_COLUMNS',
          message: 'Información guardada exitosamente en el sistema. Para sincronizarla de forma nativa en Supabase, ejecuta en su Editor SQL: ALTER TABLE solicitudes_instalacion ADD COLUMN IF NOT EXISTS notas text, ADD COLUMN IF NOT EXISTS latitud double precision, ADD COLUMN IF NOT EXISTS longitud double precision;',
          source: 'local_fallback',
        });
      }

      console.error('Error al actualizar en Supabase:', error);
    }

    return Response.json({ ok: true, message: 'Registro actualizado localmente.', source: 'local' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al actualizar registro';
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
