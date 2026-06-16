import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Global CORS headers enabling communication between browsers, terminals, and devices
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-KEY',
};

/**
 * 1. OPTIONS HANDLER (CORS Preflight)
 * Automatically responds to browser security pre-checks.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * 2. GET HANDLER (Database Read)
 * Fetches the latest telemetry packet from Upstash Redis to supply the frontend UI.
 */
export async function GET() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Database configuration variables missing on Vercel." },
        { status: 500, headers: corsHeaders }
      );
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Retrieve the current payload stored in Redis
    const data = await redis.get('pawguard_data');

    return NextResponse.json(
      { success: true, telemetry: data },
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch database stream" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * 3. POST HANDLER (Database Write)
 * Authenticates incoming device traffic, formats payloads safely, and updates Redis.
 */
export async function POST(req: Request) {
  // Validate Security Key
  const authHeader = req.headers.get('x-api-key');
  if (authHeader !== process.env.HARDWARE_SECRET_KEY) {
    return NextResponse.json(
      { success: false, error: "Unauthorized API Key" },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Database configuration variables missing on Vercel." },
        { status: 500, headers: corsHeaders }
      );
    }

    // Robust text parsing to bypass shell/terminal character encoding glitches (UTF-16)
    const rawText = await req.text();
    let body;
    try {
      body = JSON.parse(rawText.trim());
    } catch (parseError: any) {
      return NextResponse.json(
        { success: false, error: `JSON Character Parsing Failure: ${parseError.message}` },
        { status: 400, headers: corsHeaders }
      );
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Commit telemetry packet with a live backend timestamp
    await redis.set('pawguard_data', JSON.stringify({
      ...body,
      timestamp: new Date().toISOString()
    }));
    
    return NextResponse.json(
      { success: true, message: "LIVE_DATABASE_SUCCESS" },
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}