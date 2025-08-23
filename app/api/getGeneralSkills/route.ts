import { NextResponse } from "next/server";

export async function GET(req: Request) {
  return NextResponse.json({
    skills: ["General skill example 1", "General skill example 2"]
  });
}
