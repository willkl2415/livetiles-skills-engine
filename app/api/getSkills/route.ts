// app/api/getDomainSkills/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function detectIntent(query: string): "procedural" | "definition" | "list" | "comparative" | "reason" | "general" {
  const q = query.toLowerCase();
  if (q.startsWith("how do i") || q.startsWith("how to") || q.includes("steps") || q.includes("process")) return "procedural";
  if (q.startsWith("what is") || q.startsWith("define") || q.startsWith("explain")) return "definition";
  if (q.startsWith("what are") || q.includes("types of") || q.includes("examples of")) return "list";
  if (q.includes("difference between") || q.includes("compare") || q.includes("vs")) return "comparative";
  if (q.startsWith("why") || q.includes("purpose of") || q.includes("importance")) return "reason";
  return "general";
}

async function callOpenAI(prompt: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    return await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });
  } catch {
    return await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });
  } finally {
    clearTimeout(timeout);
  }
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
    let prompt = "";

    if (role && !query) {
      prompt = `Return ONLY a JSON array of the top 10 professional skills for a ${role}.`;
    } else if (query && role) {
      const intent = detectIntent(query);
      switch (intent) {
        case "procedural":
          prompt = `Return JSON: {title, steps, pro_tip} showing how a ${role} should ${query}.`;
          break;
        case "definition":
          prompt = `Return JSON: {title, steps, pro_tip} explaining "${query}" for a ${role}.`;
          break;
        case "list":
          prompt = `Return JSON: {title, steps, pro_tip} listing key elements of "${query}" for a ${role}.`;
          break;
        case "comparative":
          prompt = `Return JSON: {title, steps, pro_tip} comparing ${query} for a ${role}.`;
          break;
        case "reason":
          prompt = `Return JSON: {title, steps, pro_tip} explaining why "${query}" matters for a ${role}.`;
          break;
        default:
          prompt = `Return ONLY a JSON array of 5-10 micro-skills relevant to "${query}" for a ${role}.`;
          break;
      }
    }

    const response = await callOpenAI(prompt);
    let content = response.choices[0].message.content?.trim() || "[]";
    content = content.replace(/```json/gi, "").replace(/```/g, "");

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
      skills = content.split("\n").map((s: string) => s.trim()).filter(Boolean);
    }

    return NextResponse.json({ skills });
  } catch {
    return NextResponse.json({ error: "Domain fetch failed" }, { status: 500 });
  }
}
