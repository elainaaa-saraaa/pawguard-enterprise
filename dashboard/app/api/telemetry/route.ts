import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Connect to your Upstash Redis database
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// 1. GET ENDPOINT: This is what your dashboard (and your browser) reads
export async function GET() {
  try {
    const cachedData = await redis.get('telemetry');
    
    if (!cachedData) {
      return NextResponse.json({ success: false, error: "Database is currently empty" });
    }

    return NextResponse.json({ 
      success: true, 
      telemetry: cachedData 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to connect to Redis" }, { status: 500 });
  }
}

// 2. POST ENDPOINT: This is where your Python simulator or ESP hardware sends data
export async function POST(request: Request) {
  try {
    // Security check for your secret key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'PawGuard_2026_171006') {
      return NextResponse.json({ success: false, error: 'Unauthorized hardware signature' }, { status: 401 });
    }

    const body = await request.json();
    
    // Save the live incoming packet directly into the 'telemetry' key in Redis
    await redis.set('telemetry', JSON.stringify(body));

    return NextResponse.json({ success: true, message: 'Telemetry frame synchronized successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Malformed telemetry packet payload' }, { status: 400 });
  }
}