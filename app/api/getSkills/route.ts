// app/api/getSkills/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Simple intent detection
function detectIntent(query: string): "procedural" | "definition" | "list" | "comparative" | "reason" | "general" {
  const q = query.toLowerCase();

  if (q.startsWith("how do i") || q.startsWith("how to") || q.includes("steps") || q.includes("process"))
    return "procedural";

  if (q.startsWith("what is") || q.startsWith("define") || q.startsWith("explain") || q.includes("overview"))
    return "definition";

  if (q.startsWith("what are") || q.includes("types of") || q.includes("examples of") || q.includes("key elements") || q.includes("main factors"))
    return "list";

  if (q.includes("difference between") || q.includes("compare") || q.includes("vs") || q.includes("pros and cons"))
    return "comparative";

  if (q.startsWith("why") || q.includes("purpose of") || q.includes("importance"))
    return "reason";

  return "general";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const query = searchParams.get("query");
  const industry = searchParams.get("industry") || "";
  const func = searchParams.get("func") || "";

  if (!role && !query) {
    return NextResponse.json({ error: "Missing role or query" }, { status: 400 });
  }

  try {
    // === Irrelevance filter (works for both Domain + General) ===
    const irrelevantKeywords = [
      "boil an egg",
      "make a cup of tea",
      "iron a shirt",
      "cook",
      "recipe",
      "laundry",
      "clean",
      "household",
      "domestic"
    ];

    if (query) {
      const qLower = query.toLowerCase();
      if (irrelevantKeywords.some(p => qLower.includes(p))) {
        return NextResponse.json({
          skills: [
            "⚠️ That question doesn’t seem relevant to professional skills. Please rephrase."
          ]
        });
      }
    }

    let prompt = "";

    // === Role-only (default) ===
    if (role && !query) {
      prompt = `Return ONLY a valid JSON array of the top 10 professional skills for a ${role}.
No explanations, no code block markers, no formatting --- just pure JSON array.`;
    }

    // === Role + Query ===
    else if (query && role) {
      const intent = detectIntent(query);

      switch (intent) {
        case "procedural":
          prompt = `Generate ONLY a valid JSON object for a step-by-step guide showing how a ${role} should ${query}.
Return JSON: {title, steps, pro_tip}, where steps = 5-7 clear steps (<120 words).`;
          break;

        case "definition":
          prompt = `Generate ONLY a valid JSON object that explains "${query}" for a ${role}.
Return JSON: {title, steps, pro_tip}, where steps = 3 key points (<80 words).`;
          break;

        case "list":
          prompt = `Generate ONLY a valid JSON object that lists the key elements of "${query}" for a ${role}.
Return JSON: {title, steps, pro_tip}, where steps = 4-6 short items.`;
          break;

        case "comparative":
          prompt = `Generate ONLY a valid JSON object that compares ${query} for a ${role}.
Return JSON: {title, steps, pro_tip}, where steps = pros/cons or differences in bullet form.`;
          break;

        case "reason":
          prompt = `Generate ONLY a valid JSON object that explains why "${query}" is important to a ${role}.
Return JSON: {title, steps, pro_tip}, where steps = 3-5 concise justifications.`;
          break;

        default:
          prompt = `Generate ONLY a valid JSON array of 5-10 micro-skills directly relevant to this query: "${query}".
Tailor the skills specifically for the role: ${role}.
No explanations, no code block markers, no formatting --- just pure JSON array.`;
          break;
      }
    }

    // === Query only (general skills) ===
    else if (query) {
      prompt = `Generate ONLY a valid JSON array of 5-10 professional skills directly relevant to this query: "${query}".
They must be workplace/professional skills only — do not return personal, domestic, or household abilities.
No explanations, no code block markers, no formatting --- just pure JSON array.`;
    }

    let response;
    try {
      response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      });
    } catch {
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
      const parsed = JSON.parse(content);

      if (Array.isArray(parsed)) {
        skills = parsed;
      } else if (parsed && typeof parsed === "object" && parsed.steps) {
        if (parsed.title) skills.push(`📌 ${parsed.title}`);
        skills = skills.concat(parsed.steps);
        if (parsed.pro_tip) skills.push(`💡 Pro Tip: ${parsed.pro_tip}`);
      }
    } catch {
      skills = content
        .split("\n")
        .map((s) =>
          s.replace(/^\d+[\.\)]\s*/, "").replace(/["',\[\]]/g, "").trim()
        )
        .filter((s) => s.length > 0);
    }

    // ✅ Domain-mode post-response relevance check
    if (query && role) {
      const contextWords = [role, industry, func].filter(Boolean).map(s => s.toLowerCase());
      const joinedResponse = skills.join(" ").toLowerCase();

      const relevant = contextWords.some(word => joinedResponse.includes(word));
      if (!relevant) {
        return NextResponse.json({
          skills: [
            "⚠️ That question doesn’t seem relevant to your role. Try asking in General mode or rephrase."
          ]
        });
      }
    }

    return NextResponse.json({ skills });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch skills from OpenAI" },
      { status: 500 }
    );
  }
}
