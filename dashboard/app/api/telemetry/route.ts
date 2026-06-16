import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  return NextResponse.json({ 
    success: "MARKER_TEST_PASSED",
    message: "IF YOU SEE THIS, THE DEPLOYMENT IS WORKING" 
  });
}