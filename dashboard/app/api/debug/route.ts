import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: "THIS IS THE NEW CODE!!!" });
}