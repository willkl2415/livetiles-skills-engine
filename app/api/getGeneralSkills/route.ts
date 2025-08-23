import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ skills: ["⚠️ General search requires a query."] });
  }

  // TODO: Replace with real general logic
  return NextResponse.json({
    skills: [`General result for "${query}"`],
  });
}
