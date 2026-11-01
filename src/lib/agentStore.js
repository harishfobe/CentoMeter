import { useSyncExternalStore } from "react";
import { readLocal, writeLocal } from "../Discovery";
import { indianMobile } from "../PropertyModel";
import {
  accessStatus,
  setAccessRequests,
  setAccessViewer,
} from "./locationAccess";
let viewerId;
try {
  viewerId = sessionStorage.getItem("centometer-buyer");
  if (!viewerId) {
    viewerId = crypto.randomUUID();
    sessionStorage.setItem("centometer-buyer", viewerId);
  }
} catch {
  viewerId = "session-" + Math.random().toString(36).slice(2);
}
export { viewerId };
setAccessViewer(viewerId);
const key = "centometer-agents-v2";
const empty = {
  followed: [],
  saved: [],
  requests: [],
  visits: [],
  overrides: {},
  reports: [],
  events: [],
};
const stored = readLocal(key, null);
let state =
  stored && typeof stored === "object" ? { ...empty, ...stored } : empty;
for (const field of [
  "followed",
  "saved",
  "requests",
  "visits",
  "reports",
  "events",
])
  if (!Array.isArray(state[field])) state[field] = [];
if (!state.overrides || typeof state.overrides !== "object")
  state.overrides = {};
const listeners = new Set();
setAccessRequests(state.requests);
export const LIMITS = { daily: 5, declineCooldownMs: 86400000 };
export const snapshot = () => state;
let writeTimer;
export function flushStore() {
  clearTimeout(writeTimer);
  writeLocal(key, state);
}
if (typeof window !== "undefined")
  window.addEventListener("pagehide", flushStore);
export function notifyAgent(message) {
  if (typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent("centometer-toast", { detail: message }),
    );
}
export function requestVisit(p, buyer, date) {
  const phone = indianMobile(buyer.phone);
  if (!buyer.name?.trim() || !phone || !/^\d{4}-\d{2}-\d{2}$/.test(date || ""))
    throw Error("Enter your name, a valid Indian mobile and a visit date.");
  const visit = {
    id: crypto.randomUUID(),
    propertyId: p.id,
    agentId: p.agentId,
    viewerId,
    buyer: { name: buyer.name.trim(), phone },
    date,
    status: "requested",
    createdAt: new Date().toISOString(),
  };
  updateStore((s) => ({ ...s, visits: [visit, ...s.visits] }));
  notifyAgent("Site visit requested. This is a local demo.");
  return visit;
}
export function decideVisit(id, status) {
  updateStore((s) => ({
    ...s,
    visits: s.visits.map((v) => (v.id === id ? { ...v, status } : v)),
  }));
}
const viewedAgents = new Set();
export function updateStore(fn) {
  state = fn(state);
  setAccessRequests(state.requests);
  clearTimeout(writeTimer);
  writeTimer = setTimeout(flushStore, 250);
  listeners.forEach((fn) => fn());
}
export function useAgentStore() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    snapshot,
    snapshot,
  );
}
export const toggleStore = (field, id) =>
  updateStore((s) => ({
    ...s,
    [field]: s[field].includes(id)
      ? s[field].filter((x) => x !== id)
      : [...s[field], id],
  }));
export function canRequest(requests, id, buyer = viewerId, now = Date.now()) {
  const own = requests.filter((r) => r.viewerId === buyer);
  const last = own.find((r) => r.propertyId === id);
  if (last && ["requested", "approved"].includes(accessStatus(last, now)))
    return "A request is already active.";
  if (
    last &&
    ["declined", "revoked"].includes(last.status) &&
    now - Date.parse(last.repliedAt || last.createdAt) <
      LIMITS.declineCooldownMs
  )
    return "Please wait 24 hours after a decline or revocation.";
  if (
    own.filter((r) => now - Date.parse(r.createdAt) < 86400000).length >=
    LIMITS.daily
  )
    return "Daily request limit reached. Try tomorrow.";
  return "";
}
export function requestLocation(p, buyer, source = "direct") {
  const error = canRequest(state.requests, p.id);
  const phone = indianMobile(buyer.phone);
  if (error) throw Error(error);
  if (!buyer.name?.trim() || !phone || !buyer.consent)
    throw Error("Enter your name, a valid Indian mobile and consent.");
  const request = {
    id: crypto.randomUUID(),
    propertyId: p.id,
    agentId: p.agentId,
    viewerId,
    buyer: { ...buyer, name: buyer.name.trim(), phone },
    source: ["ig", "share"].includes(source) ? source : "direct",
    status: "requested",
    createdAt: new Date().toISOString(),
  };
  updateStore((s) => ({ ...s, requests: [request, ...s.requests] }));
  return request;
}
export function decideRequest(id, status, hours = 24) {
  updateStore((s) => ({
    ...s,
    requests: s.requests.map((r) =>
      r.id === id
        ? {
            ...r,
            status,
            repliedAt: new Date().toISOString(),
            expiresAt:
              status === "approved" && hours
                ? new Date(Date.now() + hours * 3600000).toISOString()
                : null,
          }
        : r,
    ),
  }));
}
export function recordEvent(kind, agentId, source = "direct") {
  if (kind === "views") {
    const sessionKey = "centometer-view:" + agentId;
    if (viewedAgents.has(agentId)) return;
    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      /* Memory fallback for this session. */
    }
    viewedAgents.add(agentId);
  }
  updateStore((s) => ({
    ...s,
    events: [
      ...s.events.slice(-999),
      { kind, agentId, source, at: new Date().toISOString() },
    ],
  }));
}
