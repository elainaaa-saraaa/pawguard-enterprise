import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// This explicitly tells Next.js NEVER to cache this API route
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-KEY, x-api-key',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      return NextResponse.json(
        { success: false, error: "Database environmental variables missing on Vercel." },
        { status: 500, headers: corsHeaders }
      );
    }

    const redis = new Redis({ url, token });
    const data = await redis.get('pawguard_data');

    return NextResponse.json(
      { success: true, telemetry: data },
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch database stream" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('x-api-key');
  if (authHeader !== process.env.HARDWARE_SECRET_KEY) {
    return NextResponse.json(
      { success: false, error: "Unauthorized API Key" },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      return NextResponse.json(
        { success: false, error: "Database environmental variables missing on Vercel." },
        { status: 500, headers: corsHeaders }
      );
    }

    const rawText = await req.text();
    let body;
    try {
      body = JSON.parse(rawText.trim());
    } catch (parseError: any) {
      return NextResponse.json(
        { success: false, error: `JSON Character Parsing Failure: ${parseError.message}` },
        { status: 400, headers: corsHeaders }
      );
    }

    const redis = new Redis({ url, token });

    await redis.set('pawguard_data', JSON.stringify({
      ...body,
      timestamp: new Date().toISOString()
    }));
    
    return NextResponse.json(
      { success: true, message: "LIVE_DATABASE_SUCCESS" },
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}