import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 1. THIS IS THE "DROP-OFF" (Hardware uses this)
export async function POST(req: Request) {
  const authHeader = req.headers.get('x-api-key');
  if (authHeader !== process.env.HARDWARE_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json(); // Data from ESP32
  await redis.set('pawguard_data', JSON.stringify(body));
  return NextResponse.json({ success: true });
}

// 2. THIS IS THE "PICKUP" (Dashboard uses this)
export async function GET() {
  const data = await redis.get('pawguard_data');
  return NextResponse.json(data);
}