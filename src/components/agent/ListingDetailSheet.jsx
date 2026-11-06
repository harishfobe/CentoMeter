import { ArrowUpRight, Copy, FileImage, MapPin, Play } from "lucide-react";
import CopyButton from "../CopyButton";
import { StickyContactBar } from "../../MobileUI";
import useSheetDrag from "../../lib/useSheetDrag";
import { reducedMotion, revealGalleryImage } from "../../lib/agentMotion";
import useExpiryTick from "../../lib/useExpiryTick";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useRef } from "react";
import { money, hasValue, emiPayment } from "../../PropertyModel";
import { landArea, landDimensions } from "../../LandMeasurements";
import { LandSummary } from "../../LandDetails";
import {
  HouseVillaSummary,
  houseBuyPriceMeta,
  houseTypeEyebrow,
  usesHomeDetailLayout,
  buildHouseVillaFacts,
} from "../../HouseVillaDetails";
import { approvalLabels, pricePerCent } from "../../PlotUI";
import { EmiCalculator } from "../../PropertyExtras";
import { visitDates } from "../../JourneyUX";
import { getExactLocation, accessStatus } from "../../lib/locationAccess";
import {
  useAgentStore,
  viewerId,
  toggleStore,
  updateStore,
  requestVisit,
  notifyAgent,
} from "../../lib/agentStore";
import RequestLocationSheet from "./RequestLocationSheet";
import {
  listings as relatedListings,
  agents as relatedAgents,
  statusLabel,
} from "../../lib/agents";
import { shareAgentLink } from "../../lib/agentShare";
import LoadingSkeleton from "../LoadingSkeleton";
import PhotoSwipeDots from "../PhotoSwipeDots";
const ApprovedMap = lazy(() => import("./UnlockedMap"));
export function UnlockedMap(props) {
  return (
    <Suspense
      fallback={
        <div className="agent-location-map">
          <LoadingSkeleton kind="map" />
        </div>
      }
    >
      <ApprovedMap {...props} />
    </Suspense>
  );
}
export default function ListingDetailSheet({
  p,
  agent: a,
  Modal,
  onClose,
  source,
  onRelated,
  exiting = false,
}) {
  const drag = useSheetDrag(onClose);
  const gallery = useRef(null),
    imageStops = useRef([]);
  useEffect(() => () => imageStops.current.forEach((stop) => stop()), []);
  const s = useAgentStore();
  const [request, setRequest] = useState(false),
    [report, setReport] = useState(false),
    [visit, setVisit] = useState(false),
    [emi, setEmi] = useState(false);

  const [visitError, setVisitError] = useState("");
  const photos = Array.isArray(p.photos) ? p.photos : [];
  const [photo, setPhoto] = useState(0);
  useEffect(() => setPhoto(0), [p.id]);
  const rentalCosts = [
    ["deposit", "Deposit"],
    ["maintenance", "Monthly maintenance"],
    ["brokerage", "Brokerage"],
  ].filter(([key]) => hasValue(p[key]));
  const point = getExactLocation(p.id, viewerId);
  const req = s.requests.find(
    (r) => r.propertyId === p.id && r.viewerId === viewerId,
  );
  const now = useExpiryTick(req ? [req] : []);
  const state = accessStatus(req, now);
  const wasUnlocked = useRef(false);
  useEffect(() => {
    if (point && !wasUnlocked.current) notifyAgent("Location unlocked");
    wasUnlocked.current = !!point;
  }, [!!point]);

  const link =
    location.origin +
    location.pathname +
    "#agent/" +
    a.handle +
    "?l=" +
    p.id +
    "&src=share";
  const homeDetail = usesHomeDetailLayout(p);
  const facts = homeDetail
    ? buildHouseVillaFacts(p)
    : [
        ["Type", p.type],
        ["Beds", p.beds],
        ["Baths", p.baths],
        [
          "Area",
          p.type === "Land"
            ? landArea(p.area)
            : hasValue(p.area)
              ? p.area + " sq ft"
              : null,
        ],
        [
          "Dimensions",
          p.type === "Land" ? landDimensions(p) : null,
        ],
        ...[
          ["carpetArea", "Carpet area", " sq ft"],
          ["superArea", "Super built-up area", " sq ft"],
          ["roadWidth", "Road width", " ft"],
          ["frontage", "Frontage", " ft"],
          ["floor", "Floor", ""],
          ["totalFloors", "Total floors", ""],
          [
            "propertyAge",
            "Property age",
            Number(p.propertyAge) === 1 ? " year" : " years",
          ],
          ["possessionStatus", "Possession", ""],
          ["furnishing", "Furnishing", ""],
          ["parking", "Parking", ""],
          ["ownershipType", "Ownership", ""],
          ["facing", "Facing", ""],
          ["available", "Availability", ""],
        ]
          .filter(([key]) => hasValue(p[key]))
          .map(([key, label, unit]) => [
            label,
            unit && /^\d+(\.\d+)?$/.test(String(p[key]))
              ? p[key] + unit
              : p[key],
          ]),
        ["Status", statusLabel(p.status)],
      ].filter(([, v]) => hasValue(v));
  return (
    <Modal
      title={p.title}
      onClose={onClose}
      historyManaged
      motionKind="listing"
      exiting={exiting}
    >
      <button
        className="agent-drag-handle"
        aria-label="Drag to dismiss"
        {...drag}
        onKeyDown={(e) => {
          if (["Escape", "ArrowDown", "Enter", " "].includes(e.key)) {
            e.preventDefault();
            onClose();
          }
        }}
      >
        <span />
      </button>
      <article className="agent-detail agent-skeleton-shell">
        <div className="agent-detail-media">
          <div
            className="agent-photo-strip"
            ref={gallery}
            tabIndex="0"
            onScroll={(e) =>
              setPhoto(
                Math.round(
                  e.currentTarget.scrollLeft / e.currentTarget.clientWidth,
                ),
              )
            }
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
                e.currentTarget.scrollBy({
                  left:
                    e.currentTarget.clientWidth *
                    (e.key === "ArrowRight" ? 1 : -1),
                  behavior: reducedMotion() ? "instant" : "smooth",
                });
              }
            }}
          >
            {!photos.length && (
              <div
                className="agent-photo-placeholder"
                role="img"
                aria-label="No property photos"
              >
                No photos available
              </div>
            )}
            {photos.map((url, i) => (
              <img
                key={url + i}
                src={url}
                width="800"
                height="500"
                onLoad={(e) => {
                  e.currentTarget.dataset.loaded = "true";
                  imageStops.current.push(revealGalleryImage(e.currentTarget));
                }}
                draggable={false}
                decoding="async"
                alt={p.title + " photo " + (i + 1)}
              />
            ))}
          </div>
          <PhotoSwipeDots count={photos.length} index={photo} />
        </div>
        {p.type === "Land" ? (
          <p className="agent-listing-eyebrow">
            {p.mode === "RENT" ? "FOR RENT" : "FOR SALE"} · LAND
          </p>
        ) : homeDetail ? (
          <p className="agent-listing-eyebrow">{houseTypeEyebrow(p)}</p>
        ) : null}
        <h2>
          {money(p.price)}
          {p.mode === "RENT" ? "/mo" : ""}
        </h2>
        {p.type === "Land" && p.mode === "BUY" ? (
          <>
            <p>
              {[
                Number(p.area) > 0
                  ? "₹" +
                    Math.round(p.price / p.area).toLocaleString("en-IN") +
                    " / sqft"
                  : null,
                p.negotiable === true ||
                /^yes$/i.test(String(p.negotiable || "")) ||
                [...(p.features || []), ...(p.highlights || [])].some((x) =>
                  /negotiable/i.test(String(x)),
                )
                  ? "Negotiable"
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {pricePerCent(p) ? (
              <p className="agent-land-price-equivalent">
                Equivalent: {money(pricePerCent(p))} / Cent
              </p>
            ) : null}
          </>
        ) : homeDetail && p.mode === "BUY" ? (
          <>
            <p>
              {(() => {
                const meta = houseBuyPriceMeta(p);
                return [meta.perSqft, meta.negotiable ? "Negotiable" : null]
                  .filter(Boolean)
                  .join(" · ");
              })()}
            </p>
            <h3 className="agent-land-title">{p.title}</h3>
            <p className="agent-land-location">
              <MapPin size={15} aria-hidden="true" />
              {[p.locality, p.city].filter(Boolean).join(", ")}
            </p>
          </>
        ) : (
          <p>
            {money(p.price / p.area)} / sq ft · {p.locality}
          </p>
        )}
        {!homeDetail && p.type !== "Land" && p.mode === "BUY" ? (
          <>
            <button className="secondary" onClick={() => setEmi((v) => !v)}>
              From {money(emiPayment(p.price * 0.8, 9, 20))}/mo · EMI
              <small>20% down payment · 9% annual interest · 20 years</small>
            </button>
            {emi && <EmiCalculator p={p} />}
          </>
        ) : !homeDetail && p.type !== "Land" && rentalCosts.length > 0 ? (
          <dl className="agent-rental-costs" aria-label="Rental costs">
            {rentalCosts.map(([key, label]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{money(p[key])}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {p.type === "Land" ? (
          <LandSummary
            p={p}
            showDescription={false}
            onReport={() => setReport(true)}
          />
        ) : homeDetail ? (
          <>
            <HouseVillaSummary
              p={p}
              onReport={() => setReport(true)}
            />
            <section
              className="agent-detail-section agent-trust-card"
              aria-label="Legal and trust details"
            >
              <h3>Legal &amp; trust</h3>
              <dl className="agent-trust-details">
                {p.reraNo && (
                  <div>
                    <dt>RERA number</dt>
                    <dd>
                      <span className="agent-rera-number">{p.reraNo}</span>
                      <CopyButton
                        className="text-button agent-rera-copy"
                        value={p.reraNo}
                        aria-label="Copy RERA number"
                        successMessage="RERA number copied"
                      >
                        <Copy size={14} aria-hidden="true" /> Copy
                      </CopyButton>
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Availability confirmed</dt>
                  <dd>
                    <time dateTime={p.confirmedAt}>
                      {new Date(p.confirmedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </dd>
                </div>
              </dl>
              {Date.now() - Date.parse(p.confirmedAt) > 14 * 86400000 && (
                <p className="agent-trust-note">Not recently confirmed</p>
              )}
              {approvalLabels(p).length > 0 && (
                <div className="chips agent-detail-amenities">
                  {approvalLabels(p).map((x) => (
                    <span className="pill" key={x}>
                      {x}
                    </span>
                  ))}
                </div>
              )}
            </section>
            {p.highlights.length > 0 && (
              <section
                className="agent-detail-section"
                aria-label="Listing highlights"
              >
                <h3>Highlights</h3>
                <ul className="agent-detail-highlights">
                  {p.highlights.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
            )}
            {p.amenities.length > 0 && (
              <section
                className="agent-detail-section"
                aria-label="Listing amenities"
              >
                <h3>Amenities</h3>
                <div className="chips agent-detail-amenities">
                  {p.amenities.map((x) => (
                    <span className="pill" key={x}>
                      {x}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            <h3>Property details</h3>
            <dl className="agent-facts">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <section
              className="agent-detail-section agent-trust-card"
              aria-label="Legal and trust details"
            >
              <h3>Legal &amp; trust</h3>
              <dl className="agent-trust-details">
                {p.reraNo && (
                  <div>
                    <dt>RERA number</dt>
                    <dd>
                      <span className="agent-rera-number">{p.reraNo}</span>
                      <CopyButton
                        className="text-button agent-rera-copy"
                        value={p.reraNo}
                        aria-label="Copy RERA number"
                        successMessage="RERA number copied"
                      >
                        <Copy size={14} aria-hidden="true" /> Copy
                      </CopyButton>
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Availability confirmed</dt>
                  <dd>
                    <time dateTime={p.confirmedAt}>
                      {new Date(p.confirmedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </dd>
                </div>
              </dl>
              {Date.now() - Date.parse(p.confirmedAt) > 14 * 86400000 && (
                <p className="agent-trust-note">Not recently confirmed</p>
              )}
              {approvalLabels(p).length > 0 && (
                <div className="chips agent-detail-amenities">
                  {approvalLabels(p).map((x) => (
                    <span className="pill" key={x}>
                      {x}
                    </span>
                  ))}
                </div>
              )}
            </section>
            {p.highlights.length > 0 && (
              <section
                className="agent-detail-section"
                aria-label="Listing highlights"
              >
                <h3>Highlights</h3>
                <ul className="agent-detail-highlights">
                  {p.highlights.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
            )}
            {p.amenities.length > 0 && (
              <section
                className="agent-detail-section"
                aria-label="Listing amenities"
              >
                <h3>Amenities</h3>
                <div className="chips agent-detail-amenities">
                  {p.amenities.map((x) => (
                    <span className="pill" key={x}>
                      {x}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
        <section
          className="agent-detail-section agent-detail-description about-the-property"
          aria-label="About the property"
        >
          <h3>About the property</h3>
          <p>
            {p.description?.trim() ||
              (p.type === "Land"
                ? `A well-connected land in ${p.locality || p.city}. Ask the agent about documents and visit availability.`
                : p.type === "Commercial"
                  ? `A flexible commercial space in ${p.locality || p.city} with practical access for everyday business use.`
                  : p.type === "PG"
                    ? `A practical PG option in ${p.locality || p.city}. Ask the agent about rooms, meals, and visit timing.`
                    : `A thoughtfully planned home in ${p.locality || p.city}. Ask the agent about visit availability and documents.`)}
          </p>
        </section>
        {p.type === "Land" && p.mode === "BUY" ? (
          <div className="agent-land-emi">
            <button className="secondary" onClick={() => setEmi((v) => !v)}>
              From {money(emiPayment(p.price * 0.8, 9, 20))}/mo · EMI
              <small>20% down payment · 9% annual interest · 20 years</small>
            </button>
            {emi && <EmiCalculator p={p} />}
          </div>
        ) : null}
        {(p.floorPlanUrl || p.videoUrl) && (
          <div className="agent-detail-resources">
            {p.floorPlanUrl && (
              <a
                className="secondary agent-detail-resource"
                href={p.floorPlanUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileImage size={18} aria-hidden="true" /> Floor plan
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            )}
            {p.videoUrl && (
              <a
                className="secondary agent-detail-resource"
                href={p.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Play size={18} aria-hidden="true" /> Watch video
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            )}
          </div>
        )}
        {homeDetail && p.mode === "BUY" ? (
          <div className="agent-land-emi agent-house-emi">
            <button className="secondary" onClick={() => setEmi((v) => !v)}>
              From {money(emiPayment(p.price * 0.8, 9, 20))}/mo · EMI
              <small>20% down payment · 9% annual interest · 20 years</small>
            </button>
            {emi && <EmiCalculator p={p} />}
          </div>
        ) : null}
        <section className={"location-gate " + (point ? "is-unlocked" : "")}>
          <h3>{point ? "🔓 Location unlocked" : "🔒 Location on request"}</h3>
          <p role="status">
            {state === "unrequested"
              ? "Request the exact location"
              : statusLabel(state)}
          </p>
          <div className="agent-map-reveal" data-open={!!point}>
            {point && <UnlockedMap point={point} />}
          </div>
          {point ? (
            <p>
              {p.locality}, {p.city}
            </p>
          ) : (
            <p>
              {p.locality}, {p.city}. Neighbourhood details are public; the
              exact spot is private.
            </p>
          )}
        </section>
        <div className="agent-detail-actions">
          <div className="agent-detail-actions-primary">
            {point ? (
              <a
                className="primary"
                href={
                  "https://www.google.com/maps/dir/?api=1&destination=" +
                  point.join(",")
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                Get directions
              </a>
            ) : (
              <button
                className="primary"
                disabled={state === "requested"}
                onClick={() => setRequest(true)}
              >
                {state === "requested" ? "Requested" : "Request location"}
              </button>
            )}
          </div>
          <div className="agent-detail-actions-secondary">
            <button className="secondary" onClick={() => setVisit(true)}>
              Site visit
            </button>
            <button
              className="secondary"
              onClick={() => toggleStore("saved", p.id)}
            >
              {s.saved.includes(p.id) ? "Saved" : "Save"}
            </button>
            <button
              className="secondary"
              onClick={() => shareAgentLink(link, p.title)}
            >
              Share
            </button>
          </div>
        </div>
        <section
          className="agent-detail-related"
          aria-label="Related listings"
        >
          <div className="agent-detail-related-group">
            <h3>Similar from this agent</h3>
            <div className="agent-detail-related-list">
              {relatedListings
                .filter(
                  (x) =>
                    x.id !== p.id &&
                    x.agentId === p.agentId &&
                    x.type === p.type,
                )
                .slice(0, 3)
                .map((x) => (
                  <button
                    className="secondary"
                    key={x.id}
                    onClick={() => onRelated?.(x)}
                  >
                    {x.title}
                  </button>
                ))}
            </div>
          </div>
          <div className="agent-detail-related-group">
            <h3>More in {p.locality}</h3>
            <div className="agent-detail-related-list">
              {relatedListings
                .filter(
                  (x) =>
                    x.id !== p.id &&
                    x.locality === p.locality &&
                    x.city === p.city,
                )
                .slice(0, 3)
                .map((x) => (
                  <button
                    className="secondary"
                    key={x.id}
                    onClick={() => onRelated?.(x)}
                  >
                    {x.title} ·{" "}
                    {relatedAgents.find((a) => a.id === x.agentId)?.name}
                  </button>
                ))}
            </div>
          </div>
        </section>
        {p.type !== "Land" && (
          <button className="text-button" onClick={() => setReport(true)}>
            Report this listing
          </button>
        )}
      </article>
      <StickyContactBar property={p} agent={a} />
      {request && (
        <RequestLocationSheet
          p={p}
          agent={a}
          source={source}
          Modal={Modal}
          onClose={() => setRequest(false)}
        />
      )}{" "}
      {report && (
        <Modal title="Report listing" onClose={() => setReport(false)}>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              updateStore((s) => ({
                ...s,
                reports: [
                  ...s.reports,
                  {
                    listingId: p.id,
                    reason: new FormData(e.currentTarget).get("reason"),
                    at: new Date().toISOString(),
                  },
                ],
              }));
              notifyAgent("Report saved locally.");
              setReport(false);
            }}
          >
            <label>
              Reason
              <select name="reason">
                <option>Incorrect details</option>
                <option>Unavailable</option>
                <option>Suspicious listing</option>
              </select>
            </label>
            <button className="primary">Save report locally</button>
          </form>
        </Modal>
      )}
      {visit && (
        <Modal title="Request site visit" onClose={() => setVisit(false)}>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              try {
                requestVisit(
                  p,
                  { name: form.get("name"), phone: form.get("phone") },
                  form.get("date"),
                );
                setVisit(false);
                setVisitError("");
              } catch (error) {
                setVisitError(error.message);
              }
            }}
          >
            <label>
              Name
              <input name="name" required autoComplete="name" maxLength="80" />
            </label>
            <label>
              Indian mobile
              <input
                name="phone"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            {visitError && <p role="alert">{visitError}</p>}
            <label>
              Visit date
              <select name="date">
                {visitDates().map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <p>Preview only. No appointment is booked.</p>
            <button className="primary">Save visit request</button>
          </form>
        </Modal>
      )}
    </Modal>
  );
}
