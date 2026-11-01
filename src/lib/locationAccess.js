// Prototype only. A production API must authorize every exact-location response.
// Keep precise coordinates out of public listing records and public map projections.
// Dev/test fixtures are excluded by Vite's production branch elimination.
const exactLocations =
  import.meta.env.DEV || import.meta.env.MODE === "test"
    ? (await import("../../private/demo-locations.json")).default
    : {};
const privateApprox = new Map();
export function approximatePoint(point, radiusM = 500) {
  const angle = Math.random() * Math.PI * 2;
  const distance = radiusM * (0.2 + Math.random() * 0.4);
  return [
    point[0] + (Math.cos(angle) * distance) / 111320,
    point[1] +
      (Math.sin(angle) * distance) /
        (111320 * Math.cos((point[0] * Math.PI) / 180)),
  ];
}
export function accessStatus(request, now = Date.now()) {
  if (!request) return "unrequested";
  if (
    request.status === "approved" &&
    request.expiresAt &&
    (!Number.isFinite(Date.parse(request.expiresAt)) ||
      Date.parse(request.expiresAt) <= now)
  )
    return "expired";
  return ["requested", "approved", "declined", "expired", "revoked"].includes(
    request.status,
  )
    ? request.status
    : "unrequested";
}
export function requestFor(requests, id, viewerId = currentViewer) {
  if (!viewerId) return undefined;
  return requests.find(
    (r) => String(r.propertyId) === String(id) && r.viewerId === viewerId,
  );
}
export function isLocationLocked(
  p,
  requests = currentAccess,
  now = Date.now(),
) {
  if (!p?.agentId) return false;
  const request = requestFor(requests, p.id);
  return (
    !request ||
    request.agentId !== p.agentId ||
    accessStatus(request, now) !== "approved"
  );
}
export function exactLocation(p, requests = currentAccess, now = Date.now()) {
  if (!p) return null;
  if (!p.agentId)
    return Number.isFinite(p.lat) && Number.isFinite(p.lng)
      ? [p.lat, p.lng]
      : null;
  if (isLocationLocked(p, requests, now)) return null;
  // Production samples deliberately point at Null Island: this is a local demo, not authorization.
  const entry = exactLocations[p.id];
  const point = entry?.point || entry || (import.meta.env.PROD ? [0, 0] : null);
  return Array.isArray(point) &&
    point.length === 2 &&
    point.every(Number.isFinite)
    ? [...point]
    : null;
}
export function mapPoint(p, requests = [], now = Date.now()) {
  if (!p.agentId) return exactLocation(p, requests, now);
  if (!isLocationLocked(p, requests, now))
    return exactLocation(p, requests, now);
  return p.privacy?.mode === "radius" && Array.isArray(p.approx)
    ? p.approx
    : null;
}
export function publicBoundary(p, requests = [], now = Date.now()) {
  if (isLocationLocked(p, requests, now)) return null;
  return p.agentId ? exactLocations[p.id]?.boundary || null : p.boundary;
}
function vault() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("Private location storage is unavailable."));
      return;
    }
    const open = indexedDB.open("centometer-location-vault", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("points");
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}
export async function restoreExactLocations() {
  try {
    const db = await vault();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("points", "readonly");
      const cursor = tx.objectStore("points").openCursor();
      cursor.onsuccess = () => {
        const record = cursor.result;
        if (record) {
          exactLocations[record.key] = record.value;
          if (record.value.approx)
            privateApprox.set(record.key, record.value.approx);
          record.continue();
        }
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* Seeded locations remain available; fail closed for missing private records. */
  }
}
export async function registerExactLocation(id, point, radiusM = 500) {
  const value = {
    point: point.map(Number),
    approx: privateApprox.get(id) || approximatePoint(point, radiusM),
  };
  privateApprox.set(id, value.approx);
  const db = await vault();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction("points", "readwrite");
      tx.objectStore("points").put(value, String(id));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    exactLocations[id] = value;
    return [...value.approx];
  } finally {
    db.close();
  }
}

export function safeSearchArea(state, hasLocked) {
  return hasLocked
    ? { ...state, nearPlace: null, viewport: null, bounds: null }
    : state;
}
export const leadSourceFromSearch = (search) =>
  new URLSearchParams(search).get("src") === "ig" ? "ig" : "direct";
export function publicShare(p, url) {
  return p.title + " — " + p.city + ". " + url;
}

// Replace this function with an authenticated server endpoint. Never ship the private map in production.
export function getExactLocation(listingId, viewerId) {
  const request = currentAccess.find(
    (r) => r.propertyId === listingId && r.viewerId === viewerId,
  );
  if (accessStatus(request) !== "approved") return null;
  const value =
    exactLocations[listingId] || (import.meta.env.PROD ? [0, 0] : null);
  return value?.point
    ? [...value.point]
    : Array.isArray(value)
      ? [...value]
      : null;
}
let currentAccess = [];
export function setAccessRequests(requests) {
  currentAccess = requests;
}

let currentViewer = null;
export function setAccessViewer(id) {
  currentViewer = id;
}
