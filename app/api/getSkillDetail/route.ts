import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const skill = searchParams.get("skill");

  return NextResponse.json({
    detail: `Detailed explanation for ${skill}`
  });
}
