import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function GET() {
  try {
    const cachedData = await redis.get('telemetry');
    const historyStrings = await redis.lrange('telemetry_history', 0, 9) || [];
    
    if (!cachedData) {
      return NextResponse.json({ success: false, error: "Database empty" });
    }

    const historyLog = historyStrings.map((item: any) => 
      typeof item === 'string' ? JSON.parse(item) : item
    );

    return NextResponse.json({ 
      success: true, 
      telemetry: cachedData,
      history: historyLog
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Redis connection failure" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'PawGuard_2026_171006') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Attach ISO timestamp for client-side local conversion
    body.timestamp = new Date().toISOString();
    
    const bodyString = JSON.stringify(body);
    
    await redis.set('telemetry', bodyString);
    await redis.lpush('telemetry_history', bodyString);
    await redis.ltrim('telemetry_history', 0, 9);

    return NextResponse.json({ success: true, message: 'Telemetry synchronized' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Malformed payload' }, { status: 400 });
  }
}