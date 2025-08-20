// app/api/getSkills/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";   // ✅ Force Node runtime

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const query = searchParams.get("query");

  if (!role && !query) {
    return NextResponse.json({ error: "Missing role or query" }, { status: 400 });
  }

  try {
    let prompt = "";

    if (role && !query) {
      prompt = `Return ONLY a valid JSON array of the top 10 professional skills for a ${role}.
No explanations, no code block markers, no formatting --- just pure JSON array.`;
    } else if (query && role) {
      prompt = `Generate ONLY a valid JSON array of 5--10 micro-skills directly relevant to this query: "${query}".
Tailor the skills specifically for the role: ${role}.
No explanations, no code block markers, no formatting --- just pure JSON array.`;
    } else if (query) {
      prompt = `Generate ONLY a valid JSON array of 5--10 micro-skills directly relevant to this query: "${query}".
Make them general professional skills (not role-specific).
No explanations, no code block markers, no formatting --- just pure JSON array.`;
    }

    console.log("➡️ Prompt being sent:", prompt);

    let response;
    try {
      response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      });
    } catch (err) {
      console.warn("⚠️ gpt-4o-mini failed, retrying with gpt-4o:", err);
      response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      });
    }

    let content = response.choices[0].message.content?.trim() || "[]";
    content = content.replace(/```json/gi, "").replace(/```/g, "").trim();

    let skills: string[] = [];
    try {
      skills = JSON.parse(content);
    } catch {
      skills = content
        .split("\n")
        .map((s) =>
          s.replace(/^\d+[\.\)]\s*/, "").replace(/["',\[\]]/g, "").trim()
        )
        .filter((s) => s.length > 0);
    }

    return NextResponse.json({ skills });
  } catch (error) {
    console.error("❌ Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills from OpenAI" },
      { status: 500 }
    );
  }
}
