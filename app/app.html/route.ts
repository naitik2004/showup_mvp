import { readFile } from "node:fs/promises";
import path from "node:path";
import { fetchNavigationSummary } from "@/features/navigation/data/navigationRepository";
import { renderHomeDocument } from "@/features/navigation/server/renderHomeDocument";

export const dynamic = "force-dynamic";
export async function GET() {
  const [template, summary] = await Promise.all([
    readFile(path.join(process.cwd(), "public/showup/app.html"), "utf8"),
    fetchNavigationSummary().catch(() => null),
  ]);
  return new Response(renderHomeDocument(template, summary), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
    },
  });
}
