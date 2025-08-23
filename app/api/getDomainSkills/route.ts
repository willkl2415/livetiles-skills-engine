import { NextResponse } from "next/server";

export async function GET(req: Request) {
  return NextResponse.json({
    skills: ["Domain skill example 1", "Domain skill example 2"]
  });
}
