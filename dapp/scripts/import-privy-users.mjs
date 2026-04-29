/**
 * One-time script: import Privy users CSV into Supabase.
 *
 * Usage (run from inside dapp/):
 *   node scripts/import-privy-users.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://ptsskvwmpmausggcecia.supabase.co";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0c3NrdndtcG1hdXNnZ2NlY2lhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzkwOTEzMSwiZXhwIjoyMDg5NDg1MTMxfQ.JV5eOXytPW4B1OAoRjQ-FZF5Ey95J8zVAT8CSTnYWHU";

// CSV lives in dapp/users.csv; script lives in dapp/scripts/
const CSV_PATH = path.resolve(__dirname, "../users.csv");

// ── CSV parsing (no external deps) ───────────────────────────────────────────

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "\t" && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ── Column indices (from header row) ─────────────────────────────────────────
// ID | Created at | Custom metadata | Is guest | MFA enabled |
// External Ethereum accounts | External Solana accounts |
// Embedded Ethereum accounts | Embedded Solana accounts |
// Smart wallet accounts | Email account | ...

const COL_ID = 0;
const COL_CREATED = 1;
const COL_EXTERNAL_ETH = 5;
const COL_EMBEDDED_ETH = 7;
const COL_EMAIL = 10;

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const [_header, ...rows] = lines;

  const records = [];
  const skipped = [];

  for (const line of rows) {
    const cols = parseCSVLine(line);

    const privyId = cols[COL_ID]?.trim();
    const createdRaw = cols[COL_CREATED]?.trim();
    const externalEth = cols[COL_EXTERNAL_ETH]?.trim();
    const embeddedEth = cols[COL_EMBEDDED_ETH]?.trim();
    const email = cols[COL_EMAIL]?.trim() || null;

    // Prefer external wallet (user-owned); fall back to embedded (Privy-custodied)
    const walletAddress = externalEth || embeddedEth;

    if (!walletAddress) {
      skipped.push({ privyId, reason: "no wallet address" });
      continue;
    }

    let createdAt;
    try {
      createdAt = new Date(createdRaw).toISOString();
    } catch {
      createdAt = new Date().toISOString();
    }

    records.push({
      privy_id: privyId,
      email: email || null,
      wallet_address: walletAddress.toLowerCase(),
      auth_type: "privy",
      created_at: createdAt,
    });
  }

  console.log(`Parsed ${records.length} users. Skipped: ${skipped.length}`);
  if (skipped.length) console.log("Skipped:", skipped);

  // Upsert in batches of 100
  const BATCH = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await supabase.from("users").upsert(batch, {
      onConflict: "wallet_address",
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`Batch ${i / BATCH + 1} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`Batch ${i / BATCH + 1}: inserted ${batch.length} rows`);
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Errors: ${errors}`);
}

main().catch(console.error);
