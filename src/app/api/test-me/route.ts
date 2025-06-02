// src/app/api/test-me/route.ts
import { NextResponse } from "next/server";


// Simple GET handler

export async function GET() {

  return NextResponse.json({ message: "Hello from /api/test-me! Your route works perfectly." });

  }

