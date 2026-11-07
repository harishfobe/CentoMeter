#!/usr/bin/env node
/**
 * Makes property (and agent) listing titles unique within each city by
 * appending " · {locality}" to colliding titles. Keeps the first listing's
 * title unchanged so showcase/reference names stay intact.
 *
 * Run: npm run fix:sample-titles
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findCityFieldCollisions } from "./sampleDataInvariants.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function uniquify(listings) {
  const byCity = new Map();
  for (const p of listings) {
    const list = byCity.get(p.city) || [];
    list.push(p);
    byCity.set(p.city, list);
  }
  let changed = 0;
  for (const list of byCity.values()) {
    const byTitle = new Map();
    for (const p of list) {
      const group = byTitle.get(p.title) || [];
      group.push(p);
      byTitle.set(p.title, group);
    }
    for (const [title, group] of byTitle) {
      if (group.length < 2) continue;
      for (const p of group.slice(1)) {
        const loc = p.locality || p.id;
        const next = `${title} · ${loc}`;
        if (p.title !== next) {
          p.title = next;
          changed += 1;
        }
      }
      // Resolve locality collisions among the decorated copies.
      const again = new Map();
      for (const p of group.slice(1)) {
        const g = again.get(p.title) || [];
        g.push(p);
        again.set(p.title, g);
      }
      for (const [t2, g2] of again) {
        if (g2.length < 2) continue;
        g2.forEach((p, i) => {
          p.title = `${t2} (${i + 1})`;
          changed += 1;
        });
      }
    }
  }
  return changed;
}

function rewrite(relPath) {
  const path = join(root, relPath);
  const data = JSON.parse(readFileSync(path, "utf8"));
  const changed = uniquify(data);
  // Loop until stable (nested collisions).
  let guard = 0;
  while (findCityFieldCollisions(data, "title").length && guard < 5) {
    uniquify(data);
    guard += 1;
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
  return changed;
}

const propChanges = rewrite("src/data/properties.json");
const agentChanges = rewrite("src/data/agentListings.json");
console.log(
  `Updated titles: properties=${propChanges}, agentListings=${agentChanges}`,
);
if (findCityFieldCollisions(
  JSON.parse(readFileSync(join(root, "src/data/properties.json"), "utf8")),
  "title",
).length) {
  console.error("Title collisions remain in properties.json");
  process.exit(1);
}
