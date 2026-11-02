import { cityForLocation, normalizePostedListing } from "../PropertyModel";
import { registerExactLocation } from "./locationAccess";
import { updateStore } from "./agentStore";
export async function savePostedListing({
  data: d,
  agent,
  editing,
  drafts,
  saveListings,
}) {
  const pinCity = cityForLocation(d.location);
  if (!pinCity)
    throw new Error(
      "Choose a pin within 60 km of Bengaluru, Hyderabad or Pune.",
    );
  const id = agent
    ? editing?.agentId === agent.id
      ? editing.id
      : "al-post-" + d.id
    : d.id || editing?.id || Date.now();
  let listing = { ...d, city: pinCity, id };
  if (agent) {
    const approx = await registerExactLocation(
      id,
      d.location,
      d.shareDefault?.radiusM || 500,
    );
    listing = {
      ...normalizePostedListing(listing, agent.name),
      agentId: agent.id,
      privacy: d.shareDefault || { mode: "hidden", radiusM: 500 },
      shareDefault: d.shareDefault || {
        mode: "hidden",
        radiusM: 500,
      },
      status: "available",
      confirmedAt: new Date().toISOString(),
      amenities: d.features || [],
      highlights: d.highlights || [],
      approx,
      seller: "Agent",
      contactName: agent.name,
    };
    delete listing.lat;
    delete listing.lng;
    delete listing.location;
    delete listing.boundary;
    delete listing.address;
    delete listing.contactPhone;
    delete listing.whatsapp;
    listing.locality = d.locality || pinCity;
  }
  const next = [
    ...drafts.filter((x) => String(x.id) !== String(d.id)),
    listing,
  ];
  const result = await saveListings(next);
  if (!result.ok)
    throw new Error(
      "Device storage is full. Remove an old listing or free space and retry.",
    );
  if (agent)
    updateStore((s) => ({
      ...s,
      customListings: [
        ...(s.customListings || []).filter((p) => p.id !== id),
        listing,
      ],
    }));

  return { next, result };
}
