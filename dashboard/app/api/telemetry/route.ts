import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Redis with a check to ensure variables are loaded
const getRedisClient = () => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Missing Redis Environment Variables in Vercel");
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
};

const redis = getRedisClient();

// 1. DROP-OFF (Hardware uses this)
export async function POST(req: Request) {
  const authHeader = req.headers.get('x-api-key');
  
  // Security check
  if (authHeader !== process.env.HARDWARE_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Attempt to write to Redis
    await redis.set('pawguard_data', JSON.stringify({
      ...body,
      timestamp: new Date().toISOString()
    }));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    // This will return the EXACT error message to your terminal/browser
    console.error("DEBUG ERROR:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Unknown database error" 
    }, { status: 500 });
  }
}

// 2. PICKUP (Dashboard uses this)
export async function GET() {
  try {
    const data = await redis.get('pawguard_data');
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}