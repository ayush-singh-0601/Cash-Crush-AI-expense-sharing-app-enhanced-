import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const c = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
const g = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const m = g.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function GET(r) {
  let u = await c.query(api.inngest.getUsersWithExpenses);
  let x = u[0];
  if (!x) return NextResponse.json({ error: "No user found" }, { status: 404 });
  let e = await c.query(api.inngest.getUserMonthlyExpenses, { userId: x._id });
  if (!e?.length) return NextResponse.json({ error: "No expenses found" }, { status: 404 });
  let d = JSON.stringify({
    expenses: e,
    totalSpent: e.reduce((a, b) => a + b.amount, 0),
    categories: e.reduce((c, f) => {
      c[f.category ?? "uncategorised"] = (c[f.category] ?? 0) + f.amount;
      return c;
    }, {}),
  });
  let p = `
As a financial analyst, review this user's spending data for the past month and provide insightful observations and suggestions.
Focus on spending patterns, category breakdowns, and actionable advice for better financial management.
Use a friendly, encouraging tone. Format your response in HTML for a dashboard widget.

IMPORTANT: All monetary amounts should be shown in Indian Rupees (₹) and use the ₹ symbol. Do NOT use the dollar sign ($) or any other currency. Format all currency values as ₹12,345.67 (with comma separators and two decimal places).

User spending data:
${d}

Provide your analysis in these sections:
1. Monthly Overview
2. Top Spending Categories
3. Unusual Spending Patterns (if any)
4. Saving Opportunities
5. Recommendations for Next Month
  `.trim();
  try {
    let ai = await m.generateContent(p);
    let h = ai.response.candidates[0]?.content.parts[0]?.text ?? "";
    return NextResponse.json({
      html: h,
      expenses: e,
      totalSpent: e.reduce((a, b) => a + b.amount, 0),
      categories: e.reduce((c, f) => {
        c[f.category ?? "uncategorised"] = (c[f.category] ?? 0) + f.amount;
        return c;
      }, {}),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 