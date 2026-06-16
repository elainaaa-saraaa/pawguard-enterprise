import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const authHeader = req.headers.get('x-api-key');
  if (authHeader !== process.env.HARDWARE_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json({ error: "ENV_VARIABLES_ARE_MISSING_IN_VERCEL" }, { status: 500 });
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const body = await req.json();
    await redis.set('pawguard_data', JSON.stringify({ ...body, timestamp: new Date().toISOString() }));
    
    return NextResponse.json({ success: true, message: "LIVE_DATABASE_SUCCESS" });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "RAW_SERVER_ERROR" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "online" });
}