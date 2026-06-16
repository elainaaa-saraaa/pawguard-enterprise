import { NextResponse } from 'next/server';

// Temporary local storage array that lives in your server's memory
let localInMemoryLogs: any[] = [];

// 1. RECEIVE DATA FROM PYTHON SIMULATOR
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Add an ID and push it to the top of our local storage array
    const newLog = {
      id: Date.now(),
      ...body
    };
    
    localInMemoryLogs.unshift(newLog);
    
    // Keep only the last 20 records so your memory doesn't get cluttered
    if (localInMemoryLogs.length > 20) {
      localInMemoryLogs = localInMemoryLogs.slice(0, 20);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// 2. SEND DATA TO YOUR DASHBOARD WEB PAGE
export async function GET() {
  return NextResponse.json(localInMemoryLogs);
}