import { readLocal, writeLocal, removeLocal } from "./Discovery";
let opening;
const photoCache = new Map();
const failedRestores = new Map();
export const hasPhotoRestoreFailure = (data) =>
  !!data?.photoKey && failedRestores.has(data.photoKey);
const samePhotos = (a, b) =>
  a?.length === b.length && a.every((value, index) => value === b[index]);
function database() {
  if (!globalThis.indexedDB)
    return Promise.reject(new Error("Photo storage unavailable"));
  if (!opening)
    opening = new Promise((resolve, reject) => {
      const request = indexedDB.open("centometer-photos", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("photos");
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          opening = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        opening = null;
        reject(request.error);
      };
      request.onblocked = () => {
        opening = null;
        reject(new Error("Photo storage is blocked"));
      };
    });
  return opening;
}
async function transaction(mode, action) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("photos", mode);
    const request = action(tx.objectStore("photos"));
    let result;
    request.onsuccess = () => {
      result = request.result;
    };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || new Error("Photo storage failed"));
    tx.onabort = () => reject(tx.error || new Error("Photo storage cancelled"));
  });
}
export async function restorePhotos(data) {
  if (!data) return data;
  const fallback = Array.isArray(data.photos) ? data.photos : [];
  if (!data.photoKey) return { ...data, photos: fallback };
  try {
    const photos = await transaction("readonly", (store) =>
      store.get(data.photoKey),
    );
    if (Array.isArray(photos)) {
      photoCache.set(data.photoKey, [...photos]);
      failedRestores.delete(data.photoKey);
    } else failedRestores.set(data.photoKey, [...fallback]);
    return { ...data, photos: Array.isArray(photos) ? photos : fallback };
  } catch {
    failedRestores.set(data.photoKey, [...fallback]);
    return { ...data, photos: fallback };
  }
}
function metadataOnly(data) {
  return {
    ...data,
    photos: (Array.isArray(data.photos) ? data.photos : []).filter(
      (url) => typeof url === "string" && !/^(data:|blob:)/.test(url),
    ),
  };
}
export async function storePhotoData(data, key) {
  const safe = metadataOnly(data);
  const photos = Array.isArray(data.photos) ? data.photos : [];
  if (data.photoKey && samePhotos(failedRestores.get(data.photoKey), photos))
    return { data: safe, photosSaved: false };
  if (!photos.length) {
    // A failed restore must not erase the only reference to retained binary photos.
    if (data.photoKey && !photoCache.has(data.photoKey))
      return { data: safe, photosSaved: false };
    return { data: { ...safe, photoKey: undefined }, photosSaved: true };
  }
  if (samePhotos(photoCache.get(key), photos))
    return { data: { ...safe, photoKey: key }, photosSaved: true };
  try {
    await transaction("readwrite", (store) => store.put(photos, key));
    photoCache.set(key, [...photos]);
    failedRestores.delete(key);
    return { data: { ...safe, photoKey: key }, photosSaved: true };
  } catch {
    return {
      data: { ...safe, photoKey: undefined },
      photosSaved: !photos.some((url) => /^(data:|blob:)/.test(url)),
    };
  }
}
export async function deletePhotos(key) {
  if (!key) return;
  photoCache.delete(key);
  failedRestores.delete(key);
  try {
    await transaction("readwrite", (store) => store.delete(key));
  } catch {
    /* Metadata remains usable without IndexedDB. */
  }
}
export function isBlankDraft(data) {
  return (
    !data ||
    (![
      "title",
      "price",
      "area",
      "address",
      "description",
      "contactName",
      "contactPhone",
      "whatsapp",
      "deposit",
      "maintenance",
      "highlightNotes",
      "reraNumber",
      "parking",
      "carParking",
      "carpetArea",
      "length",
      "width",
      "ownershipType",
      "plotArea",
      "builtUpArea",
      "water",
      "roadWidth",
      "projectName",
    ].some((key) => data[key] != null && String(data[key]).trim() !== "") &&
      !data.photos?.length &&
      !data.location &&
      !data.highlights?.length)
  );
}
export async function persistDraft({ id, step, data }) {
  if (isBlankDraft(data)) return { ok: true, photosSaved: true, skipped: true };
  const stored = await storePhotoData(data, "draft:" + id);
  const record = { id, step, data: stored.data };
  const bank = readLocal("centometer-draft-bank", []);
  const next = [
    record,
    ...(Array.isArray(bank) ? bank : []).filter(
      (x) => String(x.id) !== String(id),
    ),
  ];
  const ok =
    writeLocal("centometer-draft", record) &&
    writeLocal("centometer-draft-bank", next);
  return { ok, photosSaved: stored.photosSaved };
}
export async function persistListings(listings) {
  const stored = await Promise.all(
    listings.map((d) => storePhotoData(d, "listing:" + d.id)),
  );
  return {
    ok: writeLocal(
      "centometer-listings",
      stored.map((x) => x.data),
    ),
    photosSaved: stored.every((x) => x.photosSaved),
  };
}
export async function restoreListings(listings) {
  return Promise.all(
    (Array.isArray(listings) ? listings : []).map(restorePhotos),
  );
}

export async function migrateDraftPhotos() {
  const migrate = async (record) => {
    if (
      !record?.data?.photos?.some(
        (url) => typeof url === "string" && /^(data:|blob:)/.test(url),
      )
    )
      return record;
    const stored = await storePhotoData(
      record.data,
      "legacy-draft:" + record.id,
    );
    return stored.photosSaved ? { ...record, data: stored.data } : record;
  };
  const bank = readLocal("centometer-draft-bank", []);
  if (Array.isArray(bank)) {
    const migrated = await Promise.all(bank.map(migrate));
    const latest = readLocal("centometer-draft-bank", []);
    if (Array.isArray(latest))
      writeLocal(
        "centometer-draft-bank",
        latest.map((record) => {
          const i = bank.findIndex(
            (old) =>
              String(old.id) === String(record.id) &&
              JSON.stringify(old) === JSON.stringify(record),
          );
          return i < 0 ? record : migrated[i];
        }),
      );
  }
  const current = readLocal("centometer-draft", null);
  const migrated = await migrate(current);
  if (
    migrated !== current &&
    JSON.stringify(readLocal("centometer-draft", null)) ===
      JSON.stringify(current)
  )
    writeLocal("centometer-draft", migrated);
}

// Clear only this draft; an older completion must not remove a newer editor's work.
export async function removeDraft(id) {
  const current = readLocal("centometer-draft", null);
  const bank = readLocal("centometer-draft-bank", []);
  const matches = (record) => String(record?.id) === String(id);
  const own = [current, ...(Array.isArray(bank) ? bank : [])].filter(matches);
  const removed = !matches(current) || removeLocal("centometer-draft");
  const saved = writeLocal(
    "centometer-draft-bank",
    (Array.isArray(bank) ? bank : []).filter((record) => !matches(record)),
  );
  if (!removed || !saved) return false;
  const keys = new Set([
    "draft:" + id,
    ...own
      .map((record) => record.data?.photoKey)
      .filter((key) => /^(draft:|legacy-draft:)/.test(key || "")),
  ]);
  await Promise.all([...keys].map(deletePhotos));
  return true;
}
