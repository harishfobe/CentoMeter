// Prototype only. A production API must authorize every exact-location response.
// Keep precise coordinates out of public listing records and public map projections.
const exactLocations = {
  al1: [12.978, 77.64],
  al2: [17.46, 78.367],
  al3: [18.507, 73.807],
  al4: [13.035, 77.597],
  al5: [17.391, 78.355],
  al6: [18.514, 73.774],
  al7: [12.927, 77.677],
  al8: [17.434, 78.41],
  al9: [12.981, 77.64],
  al10: [17.4, 78.337],
  al11: [18.572, 73.774],
  al12: [12.91, 77.588],
  al13: [17.44, 78.348],
  al14: [18.574, 73.774],
  al15: [12.99, 77.628],
  al16: [17.448, 78.391],
  al17: [12.978, 77.64],
  al18: [17.402, 78.385],
  al19: [18.577, 73.774],
  al20: [13.035, 77.597],
  al21: [17.451, 78.391],
  al22: [18.534, 73.844],
  al23: [12.927, 77.677],
  al24: [17.428, 78.336],
  al25: [12.981, 77.64],
  al26: [17.46, 78.367],
  al27: [18.507, 73.807],
  al28: [12.91, 77.588],
  al29: [17.391, 78.355],
  al30: [18.514, 73.774],
  p2: [12.934, 77.623],
  p5: [12.912, 77.642],
  p8: [12.913, 77.678],
  p11: [13.09, 77.598],
  p14: [12.937, 77.623],
  p17: [12.915000000000001, 77.642],
  p23: [13.093, 77.598],
  p29: [17.431, 78.41],
  p32: [17.397, 78.337],
  p35: [17.443, 78.348],
  p41: [17.394, 78.355],
  p47: [18.599, 73.763],
  p50: [18.531, 73.844],
  p53: [18.563, 73.786],
  p59: [18.543, 73.797],
  "Bengaluru-RENT-PG": [12.966, 77.652],
  "Hyderabad-RENT-PG": [17.428, 78.36],
  "Pune-RENT-PG": [18.548, 73.798],
};
export function accessStatus(request, now = Date.now()) {
  if (!request) return "unrequested";
  if (
    request.status === "approved" &&
    request.expiresAt &&
    (!Number.isFinite(Date.parse(request.expiresAt)) ||
      Date.parse(request.expiresAt) <= now)
  )
    return "expired";
  return ["requested", "approved", "declined", "expired"].includes(
    request.status,
  )
    ? request.status
    : "unrequested";
}
export function requestFor(requests, id) {
  return requests.find((r) => String(r.propertyId) === String(id));
}
export function isLocationLocked(p, requests = [], now = Date.now()) {
  if (p?.agentId && String(p.id).startsWith("al"))
    return !getExactLocation(p.id, currentViewer);
  return (
    !!p?.agentId &&
    (requestFor(requests, p.id)?.agentId !== p.agentId ||
      accessStatus(requestFor(requests, p.id), now) !== "approved")
  );
}
export function exactLocation(p, requests = [], now = Date.now()) {
  if (!p) return null;
  if (p.agentId && String(p.id).startsWith("al"))
    return getExactLocation(p.id, currentViewer);
  if (!p.agentId)
    return Number.isFinite(p.lat) && Number.isFinite(p.lng)
      ? [p.lat, p.lng]
      : null;
  if (isLocationLocked(p, requests, now)) return null;
  const entry = exactLocations[p.id];
  const point = entry?.point || entry;
  return Array.isArray(point) &&
    point.length === 2 &&
    point.every(Number.isFinite) &&
    Math.abs(point[0]) <= 90 &&
    Math.abs(point[1]) <= 180
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
export async function registerExactLocation(id, point) {
  const value = point.map(Number);
  const db = await vault();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction("points", "readwrite");
      tx.objectStore("points").put(value, String(id));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    exactLocations[id] = value;
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
  const value = exactLocations[listingId];
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
