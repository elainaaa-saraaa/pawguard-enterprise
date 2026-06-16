import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // 1. Auth Check
  const authHeader = req.headers.get('x-api-key');
  if (authHeader !== process.env.HARDWARE_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Initialize Redis INSIDE the function so it doesn't crash globally
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Missing Env Variables: UPSTASH_REDIS_REST_URL or TOKEN not set.");
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // 3. Get Data
    const body = await req.json();
    
    // 4. Save to Redis
    await redis.set('pawguard_data', JSON.stringify({
      ...body,
      timestamp: new Date().toISOString()
    }));

    return NextResponse.json({ success: true });

} catch (error: any) {
    // This logs the real error to your Vercel logs and sends it back to you
    console.error("DEBUG ERROR:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Unknown error occurred" 
    }, { status: 500 });
  }
}

export async function GET() {
    return NextResponse.json({ message: "Use POST to send data." });
}