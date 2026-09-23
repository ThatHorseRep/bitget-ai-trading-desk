import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const swPath = path.join(process.cwd(), "public", "sw.js");
  const swContent = fs.readFileSync(swPath, "utf-8");

  // Extract OFFLINE_PAGE_HTML template string from sw.js
  const match = swContent.match(/const OFFLINE_PAGE_HTML = `([\s\S]*?)`;/);
  const html = match ? match[1] : "<h1>Could not find offline page in sw.js</h1>";

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
