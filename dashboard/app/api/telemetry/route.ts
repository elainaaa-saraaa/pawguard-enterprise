import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // 1. Check incoming security key
  const authHeader = req.headers.get('x-api-key');
  if (authHeader !== process.env.HARDWARE_SECRET_KEY) {
    return NextResponse.json({ 
      success: false, 
      error: `Unauthorized. Expected key matching process.env.HARDWARE_SECRET_KEY` 
    }, { status: 401 });
  }

  try {
    // 2. Validate environment variables exist
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Vercel configuration error: UPSTASH_REDIS_REST_URL or TOKEN is missing from Environment Variables.");
    }

    // 3. Connect to Upstash
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const body = await req.json();
    
    // 4. Save data to Redis
    await redis.set('pawguard_data', JSON.stringify({
      ...body,
      timestamp: new Date().toISOString()
    }));
    
    return NextResponse.json({ success: true, message: "Data successfully saved to Redis!" });

  } catch (error: any) {
    // This will catch ANY specific Upstash or network error and print it to your terminal
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Unknown server error" 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Telemetry endpoint active." });
}