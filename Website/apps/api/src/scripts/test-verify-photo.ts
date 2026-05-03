// Smoke-test for /verify-photo.
//
// Submits each marker JPG against the subject of the matching treasure-hunt
// challenge and prints a verdict table. We expect "match" for the markers
// because they are the same scene the user is asked to capture (placeholders
// until Task 5 lands real close-ups).
//
// Usage:
//   1. In another terminal: cd Website/apps/api && npm run dev
//   2. cd Website/apps/api && npm run test-verify-photo

import fs from "node:fs/promises";
import path from "node:path";

type Case = {
  challengeId: number;
  title: string;
  marker: string;
  subject: string;
};

const API_URL = process.env.API_URL ?? "http://localhost:3001";
const REPO_ROOT = path.resolve(process.cwd(), "../.."); // Website/
const MARKER_DIR = path.join(REPO_ROOT, "public", "markers");

const cases: Case[] = [
  {
    challengeId: 1,
    title: "CH1 · La Madonnina",
    marker: "duomo-facade.jpg",
    subject:
      "La Madonnina — the golden statue of the Virgin Mary on top of the Duomo di Milano's tallest spire, viewed from below, with the Gothic facade and central spire visible.",
  },
  {
    challengeId: 3,
    title: "CH3 · Bull mosaic",
    marker: "galleria-crossing.jpg",
    subject:
      "The mosaic floor of the Galleria Vittorio Emanuele II at the centre of the octagonal crossing, with the bull emblem of Turin visible in the worn-down central panel.",
  },
  {
    challengeId: 5,
    title: "CH5 · Sala delle Cariatidi",
    marker: "palazzo-reale-facade.jpg",
    subject:
      "The Sala delle Cariatidi inside Palazzo Reale, an unrestored ballroom with damaged stucco and caryatid columns, left in ruins since the 1943 bombing.",
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
  console.log(`Markers: ${MARKER_DIR}\n`);

  const results = [];
  for (const c of cases) {
    process.stdout.write(`▶ ${c.title} (${c.marker}) ... `);
    try {
      const r = await runCase(c);
      results.push(r);
      const v = r.body?.verdict ?? "ERROR";
      const conf = typeof r.body?.confidence === "number" ? r.body.confidence.toFixed(2) : "—";
      console.log(`${v}  conf=${conf}  ${r.ms}ms`);
      if (r.body?.reason) console.log(`   reason: ${r.body.reason}`);
      if (r.status >= 400) console.log(`   error: ${JSON.stringify(r.body)}`);
    } catch (err) {
      console.log(`FAILED — ${(err as Error).message}`);
    }
  }

  console.log("\n┌────────────────────────────────┬────────────────────┬──────┬───────┐");
  console.log("│ Challenge                      │ Verdict            │ Conf │  ms   │");
  console.log("├────────────────────────────────┼────────────────────┼──────┼───────┤");
  for (const r of results) {
    const title = r.c.title.padEnd(30);
    const verdict = String(r.body?.verdict ?? "ERROR").padEnd(18);
    const conf =
      typeof r.body?.confidence === "number" ? r.body.confidence.toFixed(2) : "—   ";
    const ms = String(r.ms).padStart(5);
    console.log(`│ ${title} │ ${verdict} │ ${conf} │ ${ms} │`);
  }
  console.log("└────────────────────────────────┴────────────────────┴──────┴───────┘");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
