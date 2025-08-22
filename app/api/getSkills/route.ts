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
  const industry = searchParams.get("industry") || "";
  const func = searchParams.get("func") || "";
  const searchMode = searchParams.get("mode") || "domain";

  if (!role && !query) {
    return NextResponse.json({ error: "Missing role or query" }, { status: 400 });
  }

  try {
    let prompt = "";

    // === GENERAL MODE ===
    if (query && searchMode === "general") {
      const intent = detectIntent(query);
      switch (intent) {
        case "procedural":
          prompt = `Provide clear step-by-step instructions for: "${query}". Return JSON {title, steps, pro_tip}`;
          break;
        case "definition":
          prompt = `Explain: "${query}". Return JSON {title, explanation, key_points}`;
          break;
        case "list":
          prompt = `List key items for: "${query}". Return JSON {title, items}`;
          break;
        case "comparative":
          prompt = `Compare: "${query}". Return JSON {title, comparison, key_points}`;
          break;
        case "reason":
          prompt = `Explain why "${query}" is important. Return JSON {title, explanation, key_points}`;
          break;
        default:
          prompt = `Answer clearly: "${query}". Return JSON {answer, details}`;
          break;
      }
    }

    // === DOMAIN MODE ===
    else if (searchMode === "domain") {
      if (role && !query) {
        prompt = `Return ONLY a valid JSON array of the top 10 professional skills for a ${role}. Pure JSON array.`;
      } else if (query && role) {
        const intent = detectIntent(query);
        switch (intent) {
          case "procedural":
            prompt = `As a ${role}, explain "${query}" in steps. Return JSON {title, steps, pro_tip}`;
            break;
          case "definition":
            prompt = `As a ${role}, define "${query}". Return JSON {title, explanation, key_points}`;
            break;
          case "list":
            prompt = `As a ${role}, list the key elements of "${query}". Return JSON {title, items}`;
            break;
          case "comparative":
            prompt = `As a ${role}, compare ${query}. Return JSON {title, comparison, key_points}`;
            break;
          case "reason":
            prompt = `As a ${role}, explain why "${query}" is important. Return JSON {title, explanation, key_points}`;
            break;
          default:
            prompt = `Return ONLY a valid JSON array of 5-10 micro-skills relevant to "${query}" for a ${role}.`;
            break;
        }
      }
    }

    // === FALLBACK ===
    else if (query) {
      prompt = `Generate ONLY a valid JSON array of 5-10 professional skills for "${query}".`;
    }

    // OpenAI call
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
      } else if (parsed && typeof parsed === "object") {
        if (parsed.title) skills.push(`📌 ${parsed.title}`);
        if (parsed.steps) skills = skills.concat(parsed.steps);
        if (parsed.items) skills = skills.concat(parsed.items);
        if (parsed.answer) skills.push(parsed.answer);
        if (parsed.pro_tip) skills.push(`💡 Pro Tip: ${parsed.pro_tip}`);
        if (parsed.key_points) skills = skills.concat(parsed.key_points);
      }
    } catch {
      skills = content.split("\n").map(s => s.replace(/^\d+[\.\)]\s*/, "").replace(/["',\[\]]/g, "").trim()).filter(s => s.length > 0);
    }

    return NextResponse.json({ skills });
  } catch {
    return NextResponse.json({ error: "Failed to fetch skills from OpenAI" }, { status: 500 });
  }
}
