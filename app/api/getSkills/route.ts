// app/api/getSkills/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Intent detection
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
  let searchMode = searchParams.get("mode") || "domain";

  if (!role && !query) {
    return NextResponse.json({ error: "Missing role or query" }, { status: 400 });
  }

  try {
    let prompt = "";

    // 🔄 Auto-switch: If user asks a domain-style Q in General mode
    const intent = query ? detectIntent(query) : "general";
    if (searchMode === "general" && intent !== "general" && role) {
      searchMode = "domain";
    }

    // === GENERAL MODE ===
    if (query && searchMode === "general") {
      prompt = `Answer clearly and concisely: "${query}". 
Return ONLY valid JSON {title, answer, details}.
Limit to 150 tokens.`;
    }

    // === DOMAIN MODE ===
    else if (searchMode === "domain") {
      if (query && role) {
        switch (intent) {
          case "procedural":
            prompt = `How should a ${role} ${query}? Return ONLY valid JSON {title, steps, pro_tip}. Limit to 150 tokens.`;
            break;
          case "definition":
            prompt = `Explain "${query}" in context of a ${role}. Return ONLY valid JSON {title, explanation, key_points}. Limit to 150 tokens.`;
            break;
          case "list":
            prompt = `List elements of "${query}" for a ${role}. Return ONLY valid JSON {title, items}. Limit to 150 tokens.`;
            break;
          case "comparative":
            prompt = `Compare ${query} for a ${role}. Return ONLY valid JSON {title, comparison_points}. Limit to 150 tokens.`;
            break;
          case "reason":
            prompt = `Explain why "${query}" matters for a ${role}. Return ONLY valid JSON {title, reasons}. Limit to 150 tokens.`;
            break;
          default:
            prompt = `List 5–6 micro-skills for "${query}" relevant to a ${role}. Return ONLY JSON array. Limit to 120 tokens.`;
            break;
        }
      } else if (role && !query) {
        prompt = `List 6 core professional skills for a ${role}. Return ONLY JSON array. Limit to 100 tokens.`;
      }
    }

    // Timeout wrapper
    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));

    let response;
    try {
      response = await Promise.race([
        client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
          temperature: 0.2,
        }),
        timeout(3000),
      ]);
    } catch {
      return NextResponse.json({ skills: ["⚠️ Response timed out. Try again."] });
    }

    let content = (response as any).choices[0].message.content?.trim() || "[]";
    content = content.replace(/```json/gi, "").replace(/```/g, "").trim();

    let skills: string[] = [];
    try {
      const parsed = JSON.parse(content);

      if (Array.isArray(parsed)) {
        skills = parsed;
      } else if (parsed && typeof parsed === "object") {
        if (parsed.title) skills.push(`📌 ${parsed.title}`);
        if (parsed.steps) skills = skills.concat(parsed.steps);
        if (parsed.items) skills = skills.concat(parsed.items);
        if (parsed.comparison_points) skills = skills.concat(parsed.comparison_points);
        if (parsed.reasons) skills = skills.concat(parsed.reasons);
        if (parsed.answer) skills.push(parsed.answer);
        if (parsed.details) skills.push(parsed.details);
        if (parsed.pro_tip) skills.push(`💡 Pro Tip: ${parsed.pro_tip}`);
      }
    } catch {
      skills = content.split("\n").map(s => s.replace(/^\d+[\.\)]\s*/, "").trim()).filter(s => s.length > 0);
    }

    return NextResponse.json({ skills });
  } catch {
    return NextResponse.json({ error: "Failed to fetch skills from OpenAI" }, { status: 500 });
  }
}
