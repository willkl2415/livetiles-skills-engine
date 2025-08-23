// app/api/getGeneralSkills/route.ts
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
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const intent = detectIntent(query);
    if (intent !== "general") {
      return NextResponse.json({
        skills: ["⚠️ That looks like a work-related query. Please switch to Domain search."],
      });
    }

    const prompt = `Answer this question clearly: "${query}". Return ONLY a JSON object with {title, steps, pro_tip}.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    let content = response.choices[0].message.content?.trim() || "{}";
    content = content.replace(/```json/gi, "").replace(/```/g, "").trim();

    let skills: string[] = [];
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object" && "steps" in parsed) {
        if ((parsed as any).title) skills.push(`📌 ${(parsed as any).title}`);
        skills = skills.concat((parsed as any).steps);
        if ((parsed as any).pro_tip) skills.push(`💡 Pro Tip: ${(parsed as any).pro_tip}`);
      }
    } catch {
      skills = [content];
    }

    return NextResponse.json({ skills });
  } catch {
    return NextResponse.json({ error: "Failed to fetch skills from OpenAI" }, { status: 500 });
  }
}
