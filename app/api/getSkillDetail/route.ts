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
    return NextResponse.json({ error: "Missing skill" }, { status: 400 });
  }

  try {
    const prompt = `Provide a concise explanation (max 120 words) of the skill "${skill}".
Explain what it is, why it matters in professional roles, and give 1–2 real-world examples.
Return plain text only, no formatting.`;

    console.log("➡️ Detail prompt:", prompt);

    let response;
    try {
      response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });
    } catch (err) {
      console.warn("⚠️ gpt-4o-mini failed, retrying with gpt-4o:", err);
      response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });
    }

    const content = response.choices[0].message.content?.trim() || "";

    // ✅ Return JSON instead of HTML
    return NextResponse.json({ skill, detail: content });
  } catch (error) {
    console.error("❌ Error fetching skill detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch skill detail from OpenAI" },
      { status: 500 }
    );
  }
}
