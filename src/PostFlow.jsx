import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ChevronRight,
  X,
  Check,
  CheckCircle2,
  LocateFixed,
  ImagePlus,
  Info,
} from "lucide-react";
import {
  restorePhotos,
  removeDraft,
  hasPhotoRestoreFailure,
} from "./PhotoStorage";
import useDraftStorage from "./useDraftStorage";
import LocationSearch from "./LocationSearch";
import {
  OptionalListingFields,
  OptionalPropertyDetails,
} from "./PropertyExtras";
import {
  centers,
  cityListLabel,
  money,
  indianMobile,
  cityForLocation,
} from "./PropertyModel";
import { compressPhotos } from "./JourneyUX";
import PropertyTypes, { typeLabel } from "./PropertyTypes";
import { LandSummary, LandFields, LandAreaFields } from "./LandDetails";
import { facingDirections, supportsFacing, readLocal } from "./Discovery";
import MapView from "./MapView";
import { Modal, IconButton } from "./Modal";
export default function PostFlow({
  onExit,
  onComplete,
  city,
  initialDraft,
  agent,
}) {
  const [step, setStep] = useState(() =>
    initialDraft ? 1 : readLocal("centometer-draft", null)?.step || 0,
  );
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const emptyData = {
    type: "Apartment",
    intent: "SELL",
    title: "",
    price: "",
    area: "",
    beds: "1",
    address: "",
    description: "",
    photos: [],
    features: [],
    location: null,
    facing: "Not specified",
  };
  const [data, setData] = useState(() => ({
    ...emptyData,
    ...(initialDraft || readLocal("centometer-draft", null)?.data || {}),
  }));
  const [photosReady, setPhotosReady] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const dirty = useRef(new Set());
  const mounted = useRef(false);
  useEffect(() => {
    let active = true;
    mounted.current = true;
    restorePhotos(
      initialDraft || readLocal("centometer-draft", null)?.data || emptyData,
    )
      .then((record) => {
        if (active) {
          setData((current) => ({ ...current, photos: record.photos || [] }));
          if (hasPhotoRestoreFailure(record))
            setError(
              "Saved photos could not be restored. Their stored references are retained; reselect photos or retry later.",
            );
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Saved photos could not be restored. Keep this page open and retry.",
          );
      })
      .finally(() => {
        if (active) setPhotosReady(true);
      });
    return () => {
      active = false;
      mounted.current = false;
    };
  }, []);
  const draftId = useRef(
    initialDraft?.id || readLocal("centometer-draft", null)?.id || Date.now(),
  );
  const {
    status: draftStatus,
    flush: flushDraft,
    stop: stopDraft,
    resume: resumeDraft,
  } = useDraftStorage(
    { id: draftId.current, step, data },
    photosReady && !done,
  );
  const [leaving, setLeaving] = useState(false);
  const exit = async () => {
    setLeaving(true);
    try {
      const result = await flushDraft();
      if (result && !result.ok) {
        setError(
          "Draft could not be saved. Keep this page open and retry before leaving.",
        );
        return;
      }
      onExit();
    } catch {
      setError(
        "Draft could not be saved. Keep this page open and retry before leaving.",
      );
    } finally {
      if (mounted.current) setLeaving(false);
    }
  };
  const set = (k, v) => {
    dirty.current.add(k);
    setData((d) => ({ ...d, [k]: v }));
    setError("");
  };
  const chooseType = (type) => {
    setData((d) => ({
      ...d,
      type,
      ...(type === "Land"
        ? {
            landType: d.landType || "Residential",
            highlights: d.highlights || [],
          }
        : {}),
      photos: (type === "Land") !== (d.type === "Land") ? [] : d.photos,
      ...Object.fromEntries(
        ["title", "description", "price"]
          .filter((key) => !dirty.current.has(key))
          .map((key) => [key, ""]),
      ),
    }));
    setError("");
  };
  const chooseIntent = (intent) => {
    setData((d) => ({
      ...d,
      intent,
      type: intent === "SELL" && d.type === "PG" ? "Apartment" : d.type,
      ...Object.fromEntries(
        ["title", "description", "price"]
          .filter((key) => !dirty.current.has(key))
          .map((key) => [key, ""]),
      ),
    }));
    setError("");
  };
  const fillSample = () => {
    setData((d) => ({
      ...d,
      title:
        d.type === "Land"
          ? "A generous plot at Greenfield"
          : d.type === "PG"
            ? "A private room at Parkside PG"
            : "A sunlit home at Parkside",
      price: d.intent === "RENT" ? "12000" : "7200000",
      area: d.type === "PG" ? "180" : "1200",
      address: city + " — sample central location",
      description:
        d.type === "Land"
          ? "Residential plot with road access and open views."
          : "A bright property close to everyday conveniences.",
      photos: d.type === "Land" ? ["/land.jpg"] : ["/apartment.jpg"],
      location: centers[city],
      landType: d.type === "Land" ? "Residential" : d.landType,
      occupancy: "Private room",
      meals: "Not included",
      bathroom: "Attached",
      ac: "No",
      baths: 1,
      features: ["Parking"],
      deposit: d.intent === "RENT" ? "24000" : "",
      maintenance: d.intent === "RENT" ? "1000" : "",
    }));
    for (const key of ["title", "price", "address", "description"])
      dirty.current.add(key);
    setError("");
  };
  const [uploading, setUploading] = useState(false);
  const upload = async (e) => {
    const input = e.target;
    const files = [...input.files].slice(0, 6 - data.photos.length);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const photos = await compressPhotos(files);
      if (mounted.current) set("photos", [...data.photos, ...photos]);
    } catch (error) {
      if (mounted.current)
        setError(
          error.message || "Could not process this photo. Try another image.",
        );
    } finally {
      if (mounted.current) setUploading(false);
      input.value = "";
    }
  };
  const next = () => {
    if (step === 1 && data.type === "Land") {
      if (!data.landType && !data.subtype) {
        setError("Select a land type.");
        return;
      }
      if (
        (data.length || data.width) &&
        (!(Number(data.length) > 0) || !(Number(data.width) > 0))
      ) {
        setError("Enter a positive length and width.");
        return;
      }
    }
    if (
      step === 1 &&
      ["Villa", "Independent House"].includes(data.type) &&
      (data.length || data.width) &&
      (!(Number(data.length) > 0) || !(Number(data.width) > 0))
    ) {
      setError("Enter a positive width and length.");
      return;
    }
    if (
      step === 1 &&
      (!data.title.trim() ||
        !(Number(data.price) > 0) ||
        !(Number(data.area) > 0) ||
        data.photos.length === 0)
    ) {
      setError(
        "Add a title, a positive price and area, and at least one sample photo.",
      );
      return;
    }
    if (step === 2 && !cityForLocation(data.location)) {
      setError("Choose a pin within 60 km of " + cityListLabel + ".");
      return;
    }
    if (step === 2 && (!data.address.trim() || !data.location)) {
      setError("Add a locality and choose a point on the map.");
      return;
    }
    setError("");
    setStep(step + 1);
  };
  if (done)
    return (
      <div className="success-page">
        <span className="success-icon">
          <CheckCircle2 size={42} />
        </span>
        <p className="eyebrow">ALL SET</p>
        <h1>Your listing looks great.</h1>
        {error && <p role="status">{error}</p>}
        <p>
          Your sample listing is ready to review on this device.
          <br />
          Nothing has been published.
        </p>
        <button className="primary" onClick={exit}>
          Back to exploring
        </button>
      </div>
    );
  return (
    <section className="page post-page">
      <button
        className="back-button"
        onClick={exit}
        disabled={leaving || finishing || uploading || !photosReady}
      >
        <ArrowLeft size={18} />
        Back to exploring
      </button>
      <div className="page-intro">
        <span className="eyebrow">MAKE ROOM FOR WHAT’S NEXT</span>
        <h1>Post property</h1>
      </div>
      <div className="draft-tools">
        <span role="status">{draftStatus}</span>
        <button
          className="secondary"
          onClick={exit}
          disabled={leaving || finishing || uploading || !photosReady}
        >
          {!photosReady
            ? "Restoring draft…"
            : leaving
              ? "Saving draft…"
              : "Save draft & exit"}
        </button>
        <button className="text-button" onClick={() => setDiscardOpen(true)}>
          Discard draft
        </button>
        <button type="button" className="text-button" onClick={fillSample}>
          Fill with sample data
        </button>
      </div>
      {discardOpen && (
        <Modal
          title="Discard this draft?"
          onClose={() => setDiscardOpen(false)}
        >
          <p>This removes this unfinished draft from your device.</p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setDiscardOpen(false)}>
              Keep editing
            </button>
            <button
              className="primary"
              onClick={async () => {
                await stopDraft();
                const removed = await removeDraft(draftId.current);
                if (!removed) {
                  resumeDraft();
                  setDiscardOpen(false);
                  setError(
                    "Draft could not be discarded. Device storage is unavailable; please retry.",
                  );
                  return;
                }
                onExit();
              }}
            >
              Discard draft
            </button>
          </div>
        </Modal>
      )}
      <div className="stepper">
        {["Type", "Details", "Location", "Review"].map((s, i) => (
          <div key={s} className={i <= step ? "active" : ""}>
            <span>{i < step ? <Check size={16} /> : i + 1}</span>
            <small>{s}</small>
          </div>
        ))}
      </div>
      <div className="post-panel">
        <div className="form-stack">
          {step === 0 && (
            <>
              <h2>What would you like to list?</h2>
              <div
                className="segment"
                role="group"
                aria-label="Listing purpose"
              >
                {["SELL", "RENT"].map((i) => (
                  <button
                    type="button"
                    key={i}
                    aria-pressed={data.intent === i}
                    onClick={() => chooseIntent(i)}
                    className={data.intent === i ? "active" : ""}
                  >
                    {i === "SELL" ? "For sale" : "For rent"}
                  </button>
                ))}
              </div>
              <PropertyTypes
                mode={data.intent}
                value={data.type}
                onChange={(t) => {
                  if (t !== data.type) chooseType(t);
                }}
              />
            </>
          )}
          {step === 1 && (
            <>
              <h2>
                {data.type === "Land"
                  ? "Land details"
                  : "Tell the story of your property."}
              </h2>
              <label>
                Listing title
                <input
                  maxLength={80}
                  placeholder="Give your listing a clear title"
                  value={data.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </label>
              <div
                className={
                  "form-columns" +
                  (data.type === "Land" ? " land-price-area" : "")
                }
              >
                <label>
                  {data.intent === "RENT" ? "Monthly rent" : "Asking price"} (₹)
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter amount"
                    value={data.price}
                    onChange={(e) => set("price", e.target.value)}
                  />
                </label>
                {data.type === "Land" ? (
                  <LandAreaFields data={data} set={set} />
                ) : (
                  <label>
                    {["Villa", "Independent House"].includes(data.type)
                      ? "Total area (sq ft)"
                      : "Area (sq ft)"}
                    <input
                      type="number"
                      min="1"
                      placeholder="Enter area"
                      value={data.area}
                      onChange={(e) => set("area", e.target.value)}
                    />
                  </label>
                )}
              </div>
              {["Villa", "Independent House"].includes(data.type) && (
                <div className="form-columns">
                  <label>
                    Carpet area (sq ft)
                    <input
                      type="number"
                      min="1"
                      placeholder="Enter carpet area"
                      value={data.carpetArea ?? ""}
                      onChange={(e) => set("carpetArea", e.target.value)}
                    />
                  </label>
                  <label>
                    Car parking
                    <input
                      type="number"
                      min="0"
                      max="20"
                      placeholder="Number of cars"
                      value={data.carParking ?? ""}
                      onChange={(e) => set("carParking", e.target.value)}
                    />
                    <small>How many cars can be parked</small>
                  </label>
                </div>
              )}
              {["Villa", "Independent House"].includes(data.type) && (
                <div className="form-columns">
                  <label>
                    Width (ft)
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      inputMode="decimal"
                      placeholder="Width"
                      value={data.width || ""}
                      onChange={(e) => set("width", e.target.value)}
                    />
                  </label>
                  <label>
                    Length (ft)
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      inputMode="decimal"
                      placeholder="Length"
                      value={data.length || ""}
                      onChange={(e) => set("length", e.target.value)}
                    />
                  </label>
                </div>
              )}
              {data.type === "Land" && <LandFields data={data} set={set} />}
              {data.intent === "RENT" && (
                <div className="form-columns">
                  <label>
                    Deposit (₹)
                    <input
                      type="number"
                      min="0"
                      value={data.deposit ?? ""}
                      onChange={(e) => set("deposit", e.target.value)}
                    />
                  </label>
                  <label>
                    Monthly maintenance (₹)
                    <input
                      type="number"
                      min="0"
                      value={data.maintenance ?? ""}
                      onChange={(e) => set("maintenance", e.target.value)}
                    />
                  </label>
                </div>
              )}
              {data.type === "PG" && (
                <div className="form-columns">
                  {[
                    [
                      "occupancy",
                      "Occupancy",
                      ["Private room", "Twin sharing", "Triple sharing"],
                    ],
                    ["meals", "Meals", ["Included", "Not included"]],
                    ["bathroom", "Bathroom", ["Attached", "Shared"]],
                    ["ac", "AC", ["Yes", "No"]],
                  ].map(([key, label, options]) => (
                    <label key={key}>
                      {label}
                      <select
                        value={data[key] || ""}
                        onChange={(e) => set(key, e.target.value)}
                      >
                        <option value="">Select</option>
                        {options.map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
              {data.type !== "Land" && (
                <>
                  <label>
                    Bathrooms
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={data.baths ?? ""}
                      onChange={(e) => set("baths", e.target.value)}
                    />
                  </label>
                  <fieldset className="land-highlight-options">
                    <legend>Amenities</legend>
                    <div className="chips">
                      {[
                        "Parking",
                        "Lift access",
                        "Balcony",
                        "Wi-Fi",
                        "Housekeeping",
                        "Meals included",
                      ].map((feature) => (
                        <button
                          type="button"
                          key={feature}
                          className={
                            "chip " +
                            ((data.features || []).includes(feature)
                              ? "active"
                              : "")
                          }
                          aria-pressed={(data.features || []).includes(feature)}
                          onClick={() =>
                            set(
                              "features",
                              (data.features || []).includes(feature)
                                ? data.features.filter((x) => x !== feature)
                                : [...(data.features || []), feature],
                            )
                          }
                        >
                          {feature}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </>
              )}
              {!["Land", "Commercial"].includes(data.type) && (
                <label>
                  Bedrooms
                  <select
                    value={data.beds}
                    onChange={(e) => set("beds", e.target.value)}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
              )}
              {supportsFacing(data.type) && (
                <label>
                  Facing direction
                  <select
                    value={data.facing || "Not specified"}
                    onChange={(e) => set("facing", e.target.value)}
                  >
                    {["Not specified", ...facingDirections].map((direction) => (
                      <option key={direction}>{direction}</option>
                    ))}
                  </select>
                  {data.type !== "Land" && (
                    <small>
                      Direction the main entrance faces when looking out.
                    </small>
                  )}
                </label>
              )}
              <OptionalListingFields data={data} set={set} />
              {
                <label>
                  Description
                  <textarea
                    rows="3"
                    placeholder={
                      data.type === "Land"
                        ? "Describe access, nearby landmarks, approvals and land highlights"
                        : "Describe the property and its highlights"
                    }
                    value={data.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </label>
              }
              <div>
                <label>
                  Property photos{" "}
                  <small>
                    Up to 6 • JPG, PNG or WebP • Automatically optimized
                  </small>
                </label>
                <div className="upload-zone">
                  <ImagePlus size={27} />
                  <p>Make a beautiful first impression</p>
                  <label className="secondary upload-label">
                    {uploading ? "Optimizing photos…" : "Choose images"}
                    <input
                      aria-label="Upload property images"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={upload}
                      disabled={
                        uploading || !photosReady || data.photos.length >= 6
                      }
                    />
                  </label>
                  <button
                    className="text-button"
                    onClick={() =>
                      set(
                        "photos",
                        data.type === "Land"
                          ? ["/land.jpg"]
                          : ["/villa.jpg", "/apartment.jpg"],
                      )
                    }
                  >
                    Use sample photos
                  </button>
                  <small>
                    Draft details are saved on this device. Large photos may
                    need reselecting.
                  </small>
                </div>
                <div className="upload-previews">
                  {data.photos.map((url, i) => (
                    <div key={i}>
                      <img
                        src={url}
                        width="160"
                        height="120"
                        decoding="async"
                        alt={"Selected photo " + (i + 1)}
                      />
                      <button
                        className="photo-order"
                        onClick={() =>
                          set("photos", [
                            url,
                            ...data.photos.filter((_, j) => j !== i),
                          ])
                        }
                      >
                        {i === 0 ? "Cover photo" : "Make cover"}
                      </button>
                      {i > 0 && (
                        <button
                          className="photo-move"
                          aria-label={"Move photo " + (i + 1) + " earlier"}
                          onClick={() => {
                            const next = [...data.photos];
                            [next[i - 1], next[i]] = [next[i], next[i - 1]];
                            set("photos", next);
                          }}
                        >
                          ← Move earlier
                        </button>
                      )}
                      <IconButton
                        label={"Remove photo " + (i + 1)}
                        onClick={() =>
                          set(
                            "photos",
                            data.photos.filter((_, j) => j !== i),
                          )
                        }
                      >
                        <X size={14} />
                      </IconButton>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              {agent && (
                <fieldset>
                  <legend>Location sharing</legend>
                  <label>
                    Public map visibility
                    <select
                      value={data.shareDefault?.mode || "hidden"}
                      onChange={(e) =>
                        set("shareDefault", {
                          mode: e.target.value,
                          radiusM: data.shareDefault?.radiusM || 500,
                        })
                      }
                    >
                      <option value="hidden">Hidden</option>
                      <option value="radius">Approximate area</option>
                    </select>
                  </label>
                  {data.shareDefault?.mode === "radius" && (
                    <label>
                      Radius
                      <select
                        value={data.shareDefault.radiusM || 500}
                        onChange={(e) =>
                          set("shareDefault", {
                            ...data.shareDefault,
                            radiusM: Number(e.target.value),
                          })
                        }
                      >
                        {[300, 500, 1000].map((n) => (
                          <option key={n} value={n}>
                            {n} m
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <p>
                    Exact coordinates are stored separately. A buyer needs your
                    approval.
                  </p>
                </fieldset>
              )}
              <h2>Put your property on the map.</h2>
              <LocationSearch
                value={data.address}
                onChange={(value) => set("address", value)}
                city={city}
                onPick={(point, label) => {
                  set("location", point);
                  set("address", label);
                }}
              />
              <p className="muted">Tap the map to place your property pin.</p>
              <div className="location-picker">
                <MapView
                  city={city}
                  location={data.location}
                  onLocation={(coords) => set("location", coords)}
                />
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  if (!navigator.geolocation) {
                    setError("GPS is unavailable in this browser.");
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      if (!mounted.current) return;
                      set("location", [
                        position.coords.latitude,
                        position.coords.longitude,
                      ]);
                      setError("");
                    },
                    () =>
                      mounted.current &&
                      setError(
                        "Allow location access or place your pin on the map.",
                      ),
                    { enableHighAccuracy: true, timeout: 12000 },
                  );
                }}
              >
                <LocateFixed size={17} />
                Use my current GPS
              </button>
              <button
                className="secondary"
                onClick={() => {
                  set("location", centers[city]);
                  set("address", city + " — sample central location");
                }}
              >
                <LocateFixed size={17} />
                Use sample location
              </button>
              {data.location && (
                <p className="positive">
                  <CheckCircle2 size={16} />
                  Pin placed at{" "}
                  {data.location.map((n) => n.toFixed(4)).join(", ")}
                </p>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <h2>One last look.</h2>
              <div className="form-columns seller-contact-fields">
                <label>
                  Contact name
                  <input
                    value={data.contactName || ""}
                    placeholder="Owner or agent name"
                    onChange={(e) => set("contactName", e.target.value)}
                  />
                </label>
                <label>
                  Phone number
                  <input
                    type="tel"
                    inputMode="tel"
                    value={data.contactPhone || ""}
                    placeholder="+91 mobile number"
                    onChange={(e) => set("contactPhone", e.target.value)}
                  />
                </label>
                <label>
                  WhatsApp (optional)
                  <input
                    type="tel"
                    inputMode="tel"
                    value={data.whatsapp || ""}
                    placeholder="Same as phone if left blank"
                    onChange={(e) => set("whatsapp", e.target.value)}
                  />
                </label>
              </div>
              <OptionalPropertyDetails
                p={{ ...data, mode: data.intent === "RENT" ? "RENT" : "BUY" }}
              />
              <div className="review-image">
                <img
                  src={data.photos[0]}
                  width="600"
                  height="400"
                  decoding="async"
                  alt="Your sample listing"
                />
                <span className="badge">
                  {data.intent === "SELL" ? "For sale" : "For rent"}
                </span>
              </div>
              <div className="price">
                {money(Number(data.price))}
                {data.intent === "RENT" ? " / month" : ""}
              </div>
              <h3>{data.title}</h3>
              <p className="muted">
                {typeLabel(data.type)}
                {data.type !== "Land"
                  ? " · " + Number(data.area).toLocaleString("en-IN") + " sq ft"
                  : ""}{" "}
                · {data.address}
              </p>
              {data.type === "Land" ? (
                <LandSummary p={data} />
              ) : (
                <p>{data.description}</p>
              )}
              {data.type !== "Land" && supportsFacing(data.type) && (
                <p>
                  <strong>Facing direction:</strong>{" "}
                  {data.facing || "Not specified"}
                </p>
              )}
              <div className="note">
                <Info size={18} />
                <span>
                  This is a design preview. Finishing saves a sample listing on
                  this device only.
                </span>
              </div>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            {step > 0 ? (
              <button
                className="secondary"
                onClick={() => {
                  setStep(step - 1);
                  setError("");
                }}
              >
                Back
              </button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <button
                className="primary"
                onClick={next}
                disabled={uploading || !photosReady}
              >
                Continue
                <ChevronRight size={17} />
              </button>
            ) : (
              <button
                className="primary"
                disabled={finishing || !photosReady}
                onClick={async () => {
                  if (!indianMobile(data.contactPhone)) {
                    setError(
                      "Enter a valid 10-digit Indian mobile number starting with 6–9.",
                    );
                    return;
                  }
                  if (data.whatsapp && !indianMobile(data.whatsapp)) {
                    setError(
                      "Enter a valid WhatsApp mobile number or leave it blank.",
                    );
                    return;
                  }
                  if (
                    (data.propertyAge !== undefined &&
                      data.propertyAge !== "" &&
                      (!Number.isFinite(Number(data.propertyAge)) ||
                        Number(data.propertyAge) < 0)) ||
                    (data.totalFloors !== undefined &&
                      data.totalFloors !== "" &&
                      (!Number.isInteger(Number(data.totalFloors)) ||
                        Number(data.totalFloors) < 1))
                  ) {
                    setError(
                      "Enter a non-negative property age and a positive whole number of floors.",
                    );
                    return;
                  }
                  setFinishing(true);
                  try {
                    await onComplete({
                      ...data,
                      id: draftId.current,
                      createdAt: data.createdAt || new Date().toISOString(),
                      postedAt: data.postedAt || new Date().toISOString(),
                    });
                    await stopDraft();
                    const removed = await removeDraft(draftId.current);
                    if (mounted.current && !removed)
                      setError(
                        "Listing saved, but this draft could not be cleared from device storage.",
                      );
                    if (mounted.current) setDone(true);
                  } catch (error) {
                    if (mounted.current)
                      setError(
                        error.message ||
                          "Could not save this listing. Keep editing and retry.",
                      );
                  } finally {
                    if (mounted.current) setFinishing(false);
                  }
                }}
              >
                {finishing ? "Saving…" : "Finish preview"}
                <Check size={17} />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
