export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Helper to apply CORS cross-origin allowances so your local python script can connect securely
function applyCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

// Handle browser infrastructure preflight configuration checkouts
export async function OPTIONS() {
  return applyCorsHeaders(new NextResponse(null, { status: 204 }));
}

// 1. RECEIVE LIVE DATA PACKETS FROM PYTHON SIMULATOR
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Unshift data onto a persistent Vercel Redis list key
    await kv.lpush('telemetry_history', data);
    
    // Trim the list history data stack to a max of 25 frames to keep processing lightning-fast
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
    // Read the current telemetry queue records range out of the database
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