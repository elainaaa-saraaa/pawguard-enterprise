import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis instance directly with runtime environment parameters
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function GET() {
  try {
    const cachedData = await redis.get('telemetry');
    const historyStrings = await redis.lrange('telemetry_history', 0, 14) || [];
    
    if (!cachedData) {
      return NextResponse.json({ success: false, error: "Database cache metrics are unpopulated." });
    }

    // Safely structure cached data properties
    const currentTelemetry = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;

    // Map through array buffers to unpack records securely
    const historyLog = historyStrings.map((item: any) => 
      typeof item === 'string' ? JSON.parse(item) : item
    );

    return NextResponse.json({ 
      success: true, 
      telemetry: currentTelemetry,
      history: historyLog
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Redis cluster integration failure" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'PawGuard_2026_171006') {
      return NextResponse.json({ success: false, error: 'Unauthorized Client Access Denied' }, { status: 401 });
    }

    const body = await request.json();
    
    // Inject centralized operational timestamps for client-side execution conversions
    body.timestamp = new Date().toISOString();
    
    const bodyString = JSON.stringify(body);
    
    // Atomic data streaming sequence updates inside Redis
    await redis.set('telemetry', bodyString);
    await redis.lpush('telemetry_history', bodyString);
    await redis.ltrim('telemetry_history', 0, 14); // Retain structural depth of past 15 items 

    return NextResponse.json({ success: true, message: 'Telemetry packet synchronized completely' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Malformed system entity submission' }, { status: 400 });
  }
}