import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const industry = searchParams.get("industry");
  const func = searchParams.get("func");
  const query = searchParams.get("query");

  if (!role || !industry || !func) {
    return NextResponse.json({ skills: ["⚠️ Domain search requires role, industry, and function."] });
  }

  // TODO: Replace with real domain logic
  return NextResponse.json({
    skills: [`Result for "${query}" in ${role}, ${func}, ${industry}`],
  });
}
