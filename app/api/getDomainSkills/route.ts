// app/api/getDomainSkills/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Intent detection for Domain queries
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

  return "general"; // If general intent → refuse (hard separation)
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
    if (query) {
      const intent = detectIntent(query);
      if (intent === "general") {
        return NextResponse.json({
          skills: ["⚠️ That looks like a general question. Please switch to General search."],
        });
      }
    }

    let prompt = "";

    if (role && !query) {
      prompt = `Return ONLY a valid JSON array of the top 10 professional skills for a ${role}. Pure JSON array, no explanations.`;
    } else if (query && role) {
      const intent = detectIntent(query);
      switch (intent) {
        case "procedural":
          prompt = `Generate ONLY a JSON object for how a ${role} should ${query}. Return {title, steps, pro_tip}`;
          break;
        case "definition":
          prompt = `Generate ONLY a JSON object that explains "${query}" for a ${role}. Return {title, steps, pro_tip}`;
          break;
        case "list":
          prompt = `Generate ONLY a JSON object listing elements of "${query}" for a ${role}. Return {title, steps, pro_tip}`;
          break;
        case "comparative":
          prompt = `Generate ONLY a JSON object comparing ${query} for a ${role}. Return {title, steps, pro_tip}`;
          break;
        case "reason":
          prompt = `Generate ONLY a JSON object explaining why "${query}" is important for a ${role}. Return {title, steps, pro_tip}`;
          break;
        default:
          prompt = `Generate ONLY a valid JSON array of 5-10 micro-skills relevant to "${query}" tailored to ${role}. Pure JSON array.`;
          break;
      }
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    let content = response.choices[0].message.content?.trim() || "[]";
    content = content.replace(/```json/gi, "").replace(/```/g, "").trim();

    let skills: string[] = [];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        skills = parsed as string[];
      } else if (parsed && typeof parsed === "object" && "steps" in parsed) {
        if ((parsed as any).title) skills.push(`📌 ${(parsed as any).title}`);
        skills = skills.concat((parsed as any).steps);
        if ((parsed as any).pro_tip) skills.push(`💡 Pro Tip: ${(parsed as any).pro_tip}`);
      }
    } catch {
      skills = content.split("\n").map((s: string) => s.replace(/^\d+[\.\)]\s*/, "").trim()).filter((s: string) => s.length > 0);
    }

    return NextResponse.json({ skills });
  } catch {
    return NextResponse.json({ error: "Failed to fetch skills from OpenAI" }, { status: 500 });
  }
}
