import { NextResponse } from 'next/server';
import { apiRequest } from '@/lib/api';

const exportsByFormat = {
  json: '/exports/data.json',
  csv: '/exports/transactions.csv',
} as const;

export async function GET(
  _request: Request,
  context: { params: Promise<{ format: string }> },
) {
  const { format } = await context.params;
  if (!(format in exportsByFormat)) {
    return NextResponse.json(
      { message: 'Formato no disponible' },
      { status: 404 },
    );
  }

  const upstream = await apiRequest(
    exportsByFormat[format as keyof typeof exportsByFormat],
  );
  if (!upstream.ok) {
    return NextResponse.json(
      { message: 'No se pudo generar la exportación' },
      { status: upstream.status },
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition':
        upstream.headers.get('content-disposition') ?? 'attachment',
      'Content-Type':
        upstream.headers.get('content-type') ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
