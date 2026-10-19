export const runtime = 'nodejs';
export const revalidate = 3600; // Revalidar cada 1 hora

interface BcvApiResponse {
  ok: boolean;
  rate: number;
  date: string;
  source: string;
  formattedRate: string;
  error?: string;
}

// Tasa de seguridad por si no hay conexión a ninguna API externa
const FALLBACK_RATE = 860.18;

export async function GET(): Promise<Response> {
  // 1. Intentar con DolarApi (fuente oficial BCV)
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      const promedio = Number(data?.promedio);
      if (Number.isFinite(promedio) && promedio > 0) {
        const payload: BcvApiResponse = {
          ok: true,
          rate: promedio,
          date: data?.fechaActualizacion || new Date().toISOString(),
          source: 'Banco Central de Venezuela (DolarApi)',
          formattedRate: new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          }).format(promedio),
        };
        return Response.json(payload, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        });
      }
    }
  } catch (err) {
    console.warn('Fallo primario consultando ve.dolarapi.com:', err);
  }

  // 2. Intentar con fuente de respaldo (DolarVZLA)
  try {
    const resBackup = await fetch('https://rates.dolarvzla.com/bcv/current.json', {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(6000),
    });

    if (resBackup.ok) {
      const dataBackup = await resBackup.json();
      const usdRate = Number(dataBackup?.current?.usd);
      if (Number.isFinite(usdRate) && usdRate > 0) {
        const payload: BcvApiResponse = {
          ok: true,
          rate: usdRate,
          date: dataBackup?.current?.date || new Date().toISOString(),
          source: 'Banco Central de Venezuela (DolarVZLA)',
          formattedRate: new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          }).format(usdRate),
        };
        return Response.json(payload, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        });
      }
    }
  } catch (backupErr) {
    console.warn('Fallo secundario consultando rates.dolarvzla.com:', backupErr);
  }

  // 3. Fallback de contingencia garantizado
  const fallbackPayload: BcvApiResponse = {
    ok: true,
    rate: FALLBACK_RATE,
    date: new Date().toISOString().split('T')[0],
    source: 'Tasa de contingencia BCV',
    formattedRate: new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(FALLBACK_RATE),
  };

  return Response.json(fallbackPayload, { status: 200 });
}
