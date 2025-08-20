// app/api/getSkillDetail/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const skill = searchParams.get("skill");

  if (!skill) {
    console.error("❌ Missing skill parameter");
    return NextResponse.json({ error: "Missing skill" }, { status: 400 });
  }

  try {
    const prompt = `Provide a concise explanation (max 120 words) of the skill "${skill}".
Explain what it is, why it matters in professional roles, and give 1–2 real-world examples.
Return plain text only, no formatting.`;

    console.log("➡️ Sending prompt to OpenAI:", prompt);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    console.log("✅ OpenAI full response:", JSON.stringify(response, null, 2));

    const content =
      response.choices?.[0]?.message?.content?.trim() || "⚠️ No explanation returned";

    console.log("📦 Extracted content:", content);

    return NextResponse.json({ skill, detail: content });
  } catch (error: any) {
    console.error("❌ OpenAI API call failed");
    console.error("🔍 Error details:", error?.response?.data || error?.message || error);

    return NextResponse.json(
      { error: "Failed to fetch skill detail from OpenAI", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
