// app/api/getSkills/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Intent detection
function detectIntent(query: string): "procedural" | "definition" | "list" | "comparative" | "reason" | "general" {
  const q = query.toLowerCase();
  if (q.startsWith("how do i") || q.startsWith("how to") || q.includes("steps") || q.includes("process")) return "procedural";
  if (q.startsWith("what is") || q.startsWith("define") || q.startsWith("explain") || q.includes("overview")) return "definition";
  if (q.startsWith("what are") || q.includes("types of") || q.includes("examples of") || q.includes("key elements") || q.includes("main factors")) return "list";
  if (q.includes("difference between") || q.includes("compare") || q.includes("vs") || q.includes("pros and cons")) return "comparative";
  if (q.startsWith("why") || q.includes("purpose of") || q.includes("importance")) return "reason";
  return "general";
}

const irrelevantKeywords = ["boil an egg","make a cup of tea","iron a shirt","cook","recipe","laundry","clean","household","domestic"];

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
    let intent: ReturnType<typeof detectIntent> = "general";
    if (query) intent = detectIntent(query);

    // === General Mode ===
    if (query && searchMode === "general") {
      if (irrelevantKeywords.some(p => query.toLowerCase().includes(p))) {
        return NextResponse.json({ type: "warning", title: "That question doesn’t seem relevant to professional skills. Please rephrase." });
      }

      switch (intent) {
        case "procedural":
          prompt = `Provide step-by-step instructions for: "${query}". Return JSON {type:"procedural", title, steps:[..], pro_tip}`;
          break;
        case "definition":
          prompt = `Explain "${query}". Return JSON {type:"definition", title, steps:[..], pro_tip}`;
          break;
        case "list":
          prompt = `List the key elements of "${query}". Return JSON {type:"list", title, steps:[..], pro_tip}`;
          break;
        case "comparative":
          prompt = `Compare: "${query}". Return JSON {type:"comparative", title, steps:[..], pro_tip}`;
          break;
        case "reason":
          prompt = `Explain why "${query}" matters. Return JSON {type:"reason", title, steps:[..], pro_tip}`;
          break;
        default:
          prompt = `Answer clearly: "${query}". Return JSON {type:"general", title, steps:[..], pro_tip}`;
          break;
      }
    }

    // === Domain Mode ===
    else if (searchMode === "domain") {
      if (query && irrelevantKeywords.some(p => query.toLowerCase().includes(p))) {
        return NextResponse.json({ type: "warning", title: "That question doesn’t seem relevant to your role. Try asking in General mode or rephrase." });
      }

      if (role && !query) {
        prompt = `Return JSON {type:"skills", skills:[..]} with the top 10 professional skills for a ${role}.`;
      } else if (query && role) {
        switch (intent) {
          case "procedural":
            prompt = `Generate JSON {type:"procedural", title, steps:[..], pro_tip} for how a ${role} should ${query}.`;
            break;
          case "definition":
            prompt = `Generate JSON {type:"definition", title, steps:[..], pro_tip} explaining "${query}" for a ${role}.`;
            break;
          case "list":
            prompt = `Generate JSON {type:"list", title, steps:[..], pro_tip} listing elements of "${query}" for a ${role}.`;
            break;
          case "comparative":
            prompt = `Generate JSON {type:"comparative", title, steps:[..], pro_tip} comparing ${query} for a ${role}.`;
            break;
          case "reason":
            prompt = `Generate JSON {type:"reason", title, steps:[..], pro_tip} explaining why "${query}" matters to a ${role}.`;
            break;
          default:
            prompt = `Generate JSON {type:"skills", skills:[..]} of 5-10 micro-skills relevant to "${query}" tailored to ${role}.`;
            break;
        }
      }
    }

    // === OpenAI call ===
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    let content = response.choices[0].message.content?.trim() || "{}";
    content = content.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { type: "skills", skills: [content] };
    }

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Failed to fetch skills from OpenAI" }, { status: 500 });
  }
}
