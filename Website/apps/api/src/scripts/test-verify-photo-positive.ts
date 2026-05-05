// Companion smoke-test: submits each marker against a subject that the
// marker actually shows. We expect "match" verdicts here. This confirms the
// pipeline can return positive results, not only no-match.

import fs from "node:fs/promises";
import path from "node:path";

type Case = { title: string; marker: string; subject: string };

const API_URL = process.env.API_URL ?? "http://localhost:3001";
const REPO_ROOT = path.resolve(process.cwd(), "../..");
const MARKER_DIR = path.join(REPO_ROOT, "public", "markers");

const cases: Case[] = [
  {
    title: "Duomo facade (wide)",
    marker: "duomo-facade.jpg",
    subject:
      "The Gothic facade of the Duomo di Milano cathedral, with its pink-veined Candoglia marble, central rose window, and rows of pinnacles and statues.",
  },
  {
    title: "Galleria crossing (wide)",
    marker: "galleria-crossing.jpg",
    subject:
      "The interior of the Galleria Vittorio Emanuele II in Milan, an iron-and-glass shopping arcade with its octagonal central crossing and decorated mosaic floor.",
  },
  {
    title: "Palazzo Reale facade",
    marker: "palazzo-reale-facade.jpg",
    subject:
      "The Neoclassical facade of Palazzo Reale di Milano on Piazza del Duomo, with its arched ground-floor windows and balustraded upper level.",
  },
];

async function runCase(c: Case) {
  const file = await fs.readFile(path.join(MARKER_DIR, c.marker));
  const form = new FormData();
  form.append("photo", new Blob([file], { type: "image/jpeg" }), c.marker);
  form.append("subject", c.subject);
  const t0 = Date.now();
  const res = await fetch(`${API_URL}/verify-photo`, { method: "POST", body: form });
  const ms = Date.now() - t0;
  const body = await res.json().catch(() => ({}));
  return { c, status: res.status, body, ms };
}

async function main() {
  console.log(`API: ${API_URL}`);
  for (const c of cases) {
    process.stdout.write(`▶ ${c.title} ... `);
    try {
      const r = await runCase(c);
      const v = r.body?.verdict ?? "ERROR";
      const conf = typeof r.body?.confidence === "number" ? r.body.confidence.toFixed(2) : "—";
      console.log(`${v}  conf=${conf}  ${r.ms}ms`);
      if (r.body?.reason) console.log(`   reason: ${r.body.reason}`);
    } catch (err) {
      console.log(`FAILED — ${(err as Error).message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
