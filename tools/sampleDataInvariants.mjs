#!/usr/bin/env node
/**
 * Sample-data invariants that repeatedly break PR CI when listings are
 * redesigned (duplicate city titles/prices, missing privacy fixtures).
 *
 * Used by `npm run check:samples` and by unit tests so failures name the
 * exact colliding ids instead of opaque "expected 14 to be 15".
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadJson(relPath) {
  return JSON.parse(readFileSync(join(root, relPath), "utf8"));
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key) || [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

function duplicateGroups(items, field) {
  const byValue = groupBy(items, (item) => item[field]);
  return [...byValue.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([value, group]) => ({
      value,
      ids: group.map((item) => item.id),
      count: group.length,
    }));
}

export function findCityFieldCollisions(listings, field) {
  const issues = [];
  for (const [city, list] of groupBy(listings, (p) => p.city)) {
    for (const dup of duplicateGroups(list, field)) {
      issues.push({ city, field, ...dup });
    }
  }
  return issues;
}

export function findCategoryIssues(listings) {
  const issues = [];
  const landForbidden = [
    "beds",
    "baths",
    "furnishing",
    "occupancy",
    "meals",
    "floor",
    "deposit",
    "maintenance",
    "ac",
    "frontage",
  ];
  const commercialForbidden = [
    "beds",
    "occupancy",
    "meals",
    "pets",
    "bathroom",
  ];

  for (const p of listings) {
    if (p.type === "Land" && p.mode === "RENT") {
      issues.push({
        id: p.id,
        message: "Land listings must not use mode RENT",
      });
    }
    if (!Number.isFinite(Date.parse(p.postedAt))) {
      issues.push({
        id: p.id,
        message: `Invalid postedAt: ${JSON.stringify(p.postedAt)}`,
      });
    }
    const minPhotos = p.type === "Land" ? 1 : 2;
    if (!Array.isArray(p.photos) || p.photos.length < minPhotos) {
      issues.push({
        id: p.id,
        message: `Need ≥${minPhotos} photos, found ${p.photos?.length ?? 0}`,
      });
    } else if (new Set(p.photos).size !== p.photos.length) {
      issues.push({ id: p.id, message: "Duplicate photo urls" });
    }
    if (p.type === "Land") {
      for (const key of landForbidden) {
        if (Object.prototype.hasOwnProperty.call(p, key)) {
          issues.push({
            id: p.id,
            message: `Land listing must not include "${key}"`,
          });
        }
      }
    }
    if (p.type === "Commercial") {
      for (const key of commercialForbidden) {
        if (Object.prototype.hasOwnProperty.call(p, key)) {
          issues.push({
            id: p.id,
            message: `Commercial listing must not include "${key}"`,
          });
        }
      }
    }
    if (p.type === "Apartment") {
      const beds = Number(p.beds);
      if (!(beds > 0) || !Number.isFinite(beds)) {
        issues.push({
          id: p.id,
          message: `Apartment beds must be a positive number, found ${JSON.stringify(p.beds)}`,
        });
      }
    }
  }
  return issues;
}

export function findMissingPrivacyFixtures(agentListings, privateLocations) {
  return agentListings
    .filter((p) => {
      const entry = privateLocations?.[p.id];
      return !(
        entry &&
        Array.isArray(entry.point) &&
        entry.point.length >= 2 &&
        Number.isFinite(Number(entry.point[0])) &&
        Number.isFinite(Number(entry.point[1]))
      );
    })
    .map((p) => p.id);
}

export function auditSampleData({
  properties,
  agentListings,
  privateLocations,
} = {}) {
  const props =
    properties || loadJson("src/data/properties.json");
  const agents =
    agentListings || loadJson("src/data/agentListings.json");
  const privacy =
    privateLocations || loadJson("private/demo-locations.json");

  const titleCollisions = findCityFieldCollisions(props, "title");
  const priceCollisions = findCityFieldCollisions(props, "price");
  const categoryIssues = findCategoryIssues(props);
  const missingPrivacy = findMissingPrivacyFixtures(agents, privacy);

  return {
    ok:
      titleCollisions.length === 0 &&
      priceCollisions.length === 0 &&
      categoryIssues.length === 0 &&
      missingPrivacy.length === 0,
    titleCollisions,
    priceCollisions,
    categoryIssues,
    missingPrivacy,
  };
}

export function formatAuditReport(report) {
  const lines = [];
  if (report.titleCollisions.length) {
    lines.push("Duplicate titles within a city (properties.json):");
    for (const issue of report.titleCollisions) {
      lines.push(
        `  - ${issue.city}: "${issue.value}" used by ${issue.ids.join(", ")}`,
      );
    }
    lines.push(
      "  Fix: make titles unique per city (append · locality), or run npm run fix:sample-titles",
    );
  }
  if (report.priceCollisions.length) {
    lines.push("Duplicate prices within a city (properties.json):");
    for (const issue of report.priceCollisions) {
      lines.push(
        `  - ${issue.city}: ${issue.value} used by ${issue.ids.join(", ")}`,
      );
    }
  }
  if (report.categoryIssues.length) {
    lines.push("Category / field issues (properties.json):");
    for (const issue of report.categoryIssues) {
      lines.push(`  - ${issue.id}: ${issue.message}`);
    }
  }
  if (report.missingPrivacy.length) {
    lines.push(
      "Agent listings missing private/demo-locations.json point fixtures:",
    );
    for (const id of report.missingPrivacy) {
      lines.push(`  - ${id}`);
    }
  }
  if (!lines.length) return "Sample data invariants OK.";
  return lines.join("\n");
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const report = auditSampleData();
  const text = formatAuditReport(report);
  console.log(text);
  if (!report.ok) process.exit(1);
}
