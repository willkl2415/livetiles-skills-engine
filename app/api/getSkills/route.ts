import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  return NextResponse.json({
    skills: [
      `Default skills for role: ${role}`,
      "Skill A",
      "Skill B"
    ]
  });
}
