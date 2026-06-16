export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// This automatically handles standard Redis links or web REST links flawlessly!
const redisUrl = process.env.REDIS_URL || '';
const cleanUrl = redisUrl.startsWith('redis://') 
  ? redisUrl.replace('redis://', 'https://') 
  : redisUrl;

const kv = new Redis({
  url: cleanUrl,
  token: process.env.REDIS_TOKEN || process.env.KV_REST_API_TOKEN || '',
});
function applyCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

export async function OPTIONS() {
  return applyCorsHeaders(new NextResponse(null, { status: 204 }));
}

// 1. RECEIVE LIVE DATA PACKETS FROM PYTHON SIMULATOR
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Save telemetry packet data array frame indexes securely inside our cloud instance
    await kv.lpush('telemetry_history', data);
    await kv.ltrim('telemetry_history', 0, 24);
    
    return applyCorsHeaders(NextResponse.json({ success: true }, { status: 200 }));
  } catch (error) {
    console.error("Database Write Error:", error);
    return applyCorsHeaders(NextResponse.json({ success: false, error: "Database transmission breakdown" }, { status: 400 }));
  }
}

// 2. SERVE THE LIVE HISTORY ARRAYS TO YOUR GRAPHICAL INTERFACE
export async function GET() {
  try {
    const currentLogs = await kv.lrange('telemetry_history', 0, 24) || [];
    
    const response = NextResponse.json(currentLogs, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    return applyCorsHeaders(response);
  } catch (error) {
    return applyCorsHeaders(NextResponse.json([], { status: 500 }));
  }
}