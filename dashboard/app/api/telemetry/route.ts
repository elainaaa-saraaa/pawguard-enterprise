import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Standard CORS headers allowing safe cross-origin traffic from browsers, devices, or terminal emulators
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-KEY',
};

/**
 * 1. OPTIONS Handler
 * Handles browser CORS preflight checks automatically.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * 2. GET Handler
 * Basic endpoint health check to verify the route is live.
 */
export async function GET() {
  return NextResponse.json(
    { status: "online", message: "PawGuard Telemetry API is active." },
    { status: 200, headers: corsHeaders }
  );
}

/**
 * 3. POST Handler
 * Receives incoming security key, processes payload data, and updates Upstash Redis.
 */
export async function POST(req: Request) {
  // Validate Security Key
  const authHeader = req.headers.get('x-api-key');
  if (authHeader !== process.env.HARDWARE_SECRET_KEY) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid or missing API key." },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    // Check that Environment Variables exist in Vercel
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Database configuration variables missing on hosting environment." },
        { status: 500, headers: corsHeaders }
      );
    }

    // Robust JSON Parsing (Guards against OS/Terminal character encoding issues like UTF-16)
    const rawText = await req.text();
    let body;
    try {
      body = JSON.parse(rawText.trim());
    } catch (parseError: any) {
      return NextResponse.json(
        { success: false, error: `Malformed JSON layout: ${parseError.message}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Connect to Upstash Redis Instance
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Write the telemetry packet into Redis database
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
      { success: false, error: error.message || "Internal Server Failure" },
      { status: 500, headers: corsHeaders }
    );
  }
}