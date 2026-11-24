import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import {
  ArrowLeft,
  X,
  Check,
  ChevronRight,
  House,
  KeyRound,
  MapPin,
  Building2,
  LandPlot,
  BedDouble,
  User,
  Camera,
  Info,
  LocateFixed,
} from "lucide-react";
import {
  restorePhotos,
  hasPhotoRestoreFailure,
  removeDraft,
} from "./PhotoStorage";
import useDraftStorage from "./useDraftStorage";
import { readLocal } from "./Discovery";
import { compressPhotos } from "./JourneyUX";
import {
  centers,
  cityListLabel,
  cityForLocation,
  money,
  indianMobile,
} from "./PropertyModel";
import { builderMayList } from "./listingFit";
import { publicAsset } from "./lib/publicAsset";
import { Modal } from "./Modal";
import {
  areaBasis,
  commercialTypes,
  detailGroups,
  openLand,
  priceExtras,
  present,
  toSqft,
  factors,
  validateDetails,
  changeContext,
} from "./lib/postingFields";
import {
  initialPostingData,
  listingFromPosting,
  pinAddress,
  postingSteps,
} from "./lib/postingContext";
import "./styles/post-flow.css";

const PostLocationMap = lazy(() => import("./components/PostLocationMap"));
const typeLabel = (type) =>
  ({
    Villa: "Gated villa",
    Apartment: "Apartment / Flat",
    "Independent House": "Independent house",
  })[type] || type;
const typeIcon = (type) =>
  ({
    Land: LandPlot,
    Commercial: Building2,
    Apartment: Building2,
    PG: BedDouble,
  })[type] || House;
const fmt = (value) =>
  Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
function Choices({
  id,
  label,
  value,
  values,
  onChange,
  optional,
  multiple,
  hint,
}) {
  return (
    <fieldset className="choice-group" id={id}>
      <legend>
        {label} {optional && <small className="hint">Optional</small>}
      </legend>
      <div className="options">
        {values.map((item) => {
          const [v, text] = Array.isArray(item) ? item : [item, item],
            selected = multiple
              ? (value || []).includes(v)
              : String(value ?? "") === String(v);
          return (
            <button
              type="button"
              className={`chip ${selected ? "selected" : ""}`}
              key={v}
              aria-pressed={selected}
              onClick={() =>
                onChange(
                  multiple
                    ? selected
                      ? value.filter((x) => x !== v)
                      : [...(value || []), v]
                    : v,
                )
              }
            >
              {text}
            </button>
          );
        })}
      </div>
      {hint && <p className="hint">{hint}</p>}
    </fieldset>
  );
}
export default function PostFlow({
  onExit,
  onComplete,
  city = "Coimbatore",
  initialDraft,
  agent,
  profile,
  accountRole,
}) {
  const source = useRef(
    initialDraft
      ? { data: initialDraft, step: 1 }
      : readLocal("centometer-draft", null),
  );
  const [data, setData] = useState(() =>
    initialPostingData(source.current?.data, {
      city,
      agent,
      profile,
      accountRole,
    }),
  );
  const [step, setStep] = useState(() =>
    initialDraft
      ? 1
      : source.current?.data?.postingFlowVersion === 2
        ? Math.min(5, source.current.step || 0)
        : [0, 1, 4, 5][source.current?.step || 0] || 0,
  );
  const draftId = useRef(initialDraft?.id || source.current?.id || Date.now());
  const [errors, setErrors] = useState({}),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [photosReady, setPhotosReady] = useState(false),
    [uploading, setUploading] = useState(false),
    [finishing, setFinishing] = useState(false),
    [leaving, setLeaving] = useState(false),
    [done, setDone] = useState(false),
    [discardOpen, setDiscardOpen] = useState(false),
    [editReturn, setEditReturn] = useState(false);
  const [lookupPoint, setLookupPoint] = useState(null),
    [lookup, setLookup] = useState({ busy: false, message: "" });
  const mounted = useRef(false),
    saving = useRef(false),
    gpsVersion = useRef(0),
    heading = useRef(null);
  const {
    status: draftStatus,
    flush: flushDraft,
    stop: stopDraft,
    resume: resumeDraft,
  } = useDraftStorage(
    { id: draftId.current, step, data },
    photosReady && !done,
  );
  useEffect(() => {
    let active = true;
    mounted.current = true;
    restorePhotos(source.current?.data || data)
      .then((record) => {
        if (!active) return;
        setData((current) => ({ ...current, photos: record.photos || [] }));
        if (hasPhotoRestoreFailure(record))
          setError(
            "Saved photos could not be restored. Their stored references are retained; reselect photos or retry later.",
          );
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
      gpsVersion.current++;
    };
  }, []);
  useEffect(() => {
    if (!lookupPoint || step !== 4) return;
    const controller = new AbortController();
    let active = true,
      timeout;
    const timer = setTimeout(async () => {
      timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const url = new URL(
          import.meta.env.VITE_REVERSE_GEOCODER_URL ||
            "https://nominatim.openstreetmap.org/reverse",
        );
        url.search = new URLSearchParams({
          format: "jsonv2",
          lat: lookupPoint[0],
          lon: lookupPoint[1],
          zoom: "18",
          addressdetails: "1",
          "accept-language": "en",
        });
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
          referrerPolicy: "strict-origin-when-cross-origin",
        });
        if (!response.ok) throw Error("Address lookup unavailable");
        const result = pinAddress((await response.json()).address);
        if (!active) return;
        setData((current) => ({
          ...current,
          locality: result.locality,
          address: result.locality,
          city: result.city || cityForLocation(lookupPoint) || current.city,
        }));
        setLookup({
          busy: false,
          message: result.locality
            ? "Locality filled from your pin. Check it and correct it if needed."
            : "The map did not return a locality. Enter the village/locality below.",
        });
      } catch {
        if (active)
          setLookup({
            busy: false,
            message:
              "Could not look up this pin. Enter its locality/village below, or move the pin to retry.",
          });
      } finally {
        clearTimeout(timeout);
      }
    }, 1100);
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [lookupPoint, step]);
  const set = (key, value) => {
    setData((current) => ({
      ...current,
      [key]: value,
      ...(key === "locality" ? { address: value } : {}),
    }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setError("");
  };
  const choose = (key, value) => {
    if (["intent", "type", "subtype", "landType"].includes(key)) {
      const change = changeContext(data, key, value);
      setData(change.data);
      setNotice(change.notice);
    } else if (key === "areaUnit")
      setData((current) => ({
        ...current,
        areaUnit: value,
        area:
          Number(current.area) > 0
            ? String(Number((toSqft(current) / factors[value]).toFixed(6)))
            : current.area,
      }));
    else if (key === "seller")
      setData((current) => ({
        ...current,
        seller: value,
        posterRole: value,
        ...(value !== "Agent" ? { brokerage: "" } : {}),
      }));
    else set(key, value);
  };
  const move = (next) => {
    gpsVersion.current++;
    setLookupPoint(null);
    setLookup({ busy: false, message: "" });
    setStep(next);
    setError("");
    setErrors({});
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  };
  const exit = async () => {
    if (leaving || finishing) return;
    setLeaving(true);
    try {
      const result = await flushDraft();
      if (result && !result.ok) throw Error();
      onExit();
    } catch {
      if (mounted.current)
        setError(
          "Draft could not be saved. Keep this page open and retry before leaving.",
        );
    } finally {
      if (mounted.current) setLeaving(false);
    }
  };
  const pickPoint = (point) => {
    setData((current) => ({
      ...current,
      location: point,
      locality: "",
      address: "",
    }));
    setLookup({ busy: true, message: "Finding the pinned locality…" });
    setLookupPoint(point);
    setErrors({});
  };
  const gps = () => {
    if (!navigator.geolocation) {
      setError("Location access is unavailable. Tap the map instead.");
      return;
    }
    const version = ++gpsVersion.current;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (mounted.current && version === gpsVersion.current)
          pickPoint([p.coords.latitude, p.coords.longitude]);
      },
      () => {
        if (mounted.current && version === gpsVersion.current)
          setError(
            "Location permission was unavailable. Tap the map or place the pin at map centre.",
          );
      },
      { timeout: 10000 },
    );
  };
  const check = (target) => {
    const found = {};
    if (target === 1) {
      if (!(Number(data.price) > 0) || !Number.isFinite(Number(data.price)))
        found.price = "Enter a positive price in rupees.";
      if (!(toSqft(data) > 0) || !Number.isFinite(toSqft(data)))
        found.area = "Enter a positive property area.";
      if (data.type === "PG" && !data.occupancy)
        found.occupancy = "Choose sharing to confirm per-bed or per-room rent.";
      const details = validateDetails(data);
      for (const f of priceExtras(data))
        if (details[f.key]) found[f.key] = details[f.key];
    }
    if (target === 2) Object.assign(found, validateDetails(data));
    if (target === 3 && !data.photos.length)
      found.photos = "Add at least one property photo.";
    if (target === 4) {
      if (!data.location || !cityForLocation(data.location))
        found.location = `Choose a pin within 60 km of ${cityListLabel}.`;
      if (!data.locality?.trim())
        found.locality = "Enter the locality or village for this pin.";
    }
    if (target === 5) {
      if (!data.contactName?.trim())
        found.contactName = "Enter the contact name.";
      if (!indianMobile(data.contactPhone))
        found.contactPhone =
          "Enter a valid 10-digit Indian mobile number starting with 6–9.";
      if (data.whatsapp && !indianMobile(data.whatsapp))
        found.whatsapp =
          "Enter a valid WhatsApp mobile number or leave it blank.";
    }
    return found;
  };
  const submit = async () => {
    if (saving.current || lookup.busy || uploading || !photosReady) return;
    for (const target of step === 5 ? [1, 2, 3, 4, 5] : [step]) {
      const found = check(target);
      if (Object.keys(found).length) {
        setErrors(found);
        if (target !== step) setStep(target);
        requestAnimationFrame(() =>
          document.querySelector(".post-flow [aria-invalid=true]")?.focus(),
        );
        return;
      }
    }
    if (step < 5) {
      move(editReturn ? 5 : step + 1);
      return;
    }
    saving.current = true;
    setFinishing(true);
    setError("");
    try {
      await onComplete({
        ...listingFromPosting(data, draftId.current),
        contactPhone: indianMobile(data.contactPhone),
        whatsapp: indianMobile(data.whatsapp) || "",
      });
      await stopDraft();
      const removed = await removeDraft(draftId.current);
      if (mounted.current) {
        if (!removed)
          setError(
            "Listing saved, but this draft could not be cleared from device storage.",
          );
        setDone(true);
      }
    } catch (e) {
      if (mounted.current)
        setError(
          e.message || "Could not save this listing. Keep editing and retry.",
        );
    } finally {
      saving.current = false;
      if (mounted.current) setFinishing(false);
    }
  };
  const upload = async (e) => {
    const input = e.target,
      files = [...input.files].slice(0, 6 - data.photos.length);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const photos = await compressPhotos(files);
      if (mounted.current)
        setData((current) => ({
          ...current,
          photos: [...current.photos, ...photos].slice(0, 6),
        }));
    } catch (e) {
      if (mounted.current)
        setError(
          e.message || "Could not process this photo. Try another image.",
        );
    } finally {
      if (mounted.current) setUploading(false);
      input.value = "";
    }
  };
  const field = (
    key,
    label,
    {
      type = "text",
      optional = false,
      placeholder = "",
      hint = "",
      min = 0,
      integer = false,
      readOnly = false,
    } = {},
  ) => (
    <label className="field" htmlFor={`post-${key}`} key={key}>
      <span>
        {label}
        {optional && <small>Optional</small>}
      </span>
      <input
        id={`post-${key}`}
        aria-label={label}
        name={key}
        type={type}
        value={data[key] ?? ""}
        placeholder={placeholder}
        readOnly={readOnly}
        autoComplete={
          key === "contactName" ? "name" : type === "tel" ? "tel" : undefined
        }
        inputMode={
          type === "number"
            ? integer
              ? "numeric"
              : "decimal"
            : type === "tel"
              ? "tel"
              : undefined
        }
        min={type === "number" ? min : undefined}
        step={type === "number" ? (integer ? 1 : "any") : undefined}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `post-${key}-error` : undefined}
        onChange={(e) => set(key, e.target.value)}
      />
      {hint && <small className="hint">{hint}</small>}
      {errors[key] && (
        <span className="error" id={`post-${key}-error`}>
          {errors[key]}
        </span>
      )}
    </label>
  );
  const choices = (key, label, values, optional = false) => (
    <Choices
      key={key}
      id={`post-${key}`}
      label={label}
      values={values}
      value={data[key]}
      onChange={(value) => choose(key, value)}
      optional={optional}
    />
  );
  const input = (f) =>
    f.type === "select" || f.type === "multi" ? (
      <Choices
        key={f.key}
        id={`post-${f.key}`}
        label={f.label}
        value={data[f.key]}
        values={
          f.type === "select" ? [["", "Not specified"], ...f.values] : f.values
        }
        optional={f.optional}
        multiple={f.type === "multi"}
        hint={
          f.key === "approvals"
            ? "Seller-provided claims. These are not independently verified by CentoMeter."
            : f.hint
        }
        onChange={(value) => set(f.key, value)}
      />
    ) : (
      field(f.key, f.label, f)
    );
  const rent = data.intent === "RENT",
    isLand = openLand(data),
    groups = detailGroups(data),
    payload = listingFromPosting(data, draftId.current),
    busy = leaving || finishing || uploading || !photosReady;
  const basis = rent
    ? data.type === "PG"
      ? data.occupancy === "Private room"
        ? "per room / month"
        : "per bed / month"
      : "per month"
    : "total";
  const edit = (target) => {
    setEditReturn(true);
    move(target);
  };
  const reviewFields = (fields) => (
    <dl className="review-values">
      {fields
        .filter(
          (f) =>
            present(payload[f.key]) &&
            (!Array.isArray(payload[f.key]) || payload[f.key].length),
        )
        .map((f) => (
          <div key={f.key} data-review={f.key}>
            <dt>{f.label}</dt>
            <dd>
              {Array.isArray(payload[f.key])
                ? payload[f.key].join(", ")
                : f.money
                  ? money(payload[f.key])
                  : String(payload[f.key])}
            </dd>
          </div>
        ))}
    </dl>
  );
  const summary = (label, target, children, Icon) => (
    <section className="review-section">
      <div className="review-icon">
        <Icon size={20} />
      </div>
      <div>
        <h2>{label}</h2>
        {children}
      </div>
      <button
        type="button"
        className="edit"
        onClick={() => edit(target)}
        aria-label={`Edit ${label}`}
      >
        Edit
      </button>
    </section>
  );
  const sample = () => {
    setData((current) => ({
      ...current,
      price: rent ? "18000" : "4480000",
      area: isLand ? "5.6" : "1200",
      areaUnit: isLand ? "cents" : "sq ft",
      beds: "2",
      baths: "2",
      occupancy: data.type === "PG" ? "Twin sharing" : "",
      locality: "Kovilpalayam",
      address: "Kovilpalayam",
      city: "Coimbatore",
      location: [11.1179, 77.0369],
      photos: [isLand ? "/land.jpg" : "/apartment.jpg"],
    }));
    setError("");
  };
  return (
    <section className="post-flow">
      <div className="shell">
        <header>
          <button
            type="button"
            className="icon-button"
            onClick={() => (step && !done ? move(step - 1) : exit())}
            disabled={busy}
            aria-label={
              done
                ? "Close posting flow"
                : step
                  ? "Previous step"
                  : "Back to exploring"
            }
          >
            <ArrowLeft size={20} />
          </button>
          <strong>Post property</strong>
          <button
            type="button"
            className="icon-button"
            onClick={exit}
            disabled={busy}
            aria-label="Save draft & exit"
          >
            <X size={20} />
          </button>
        </header>
        {!done && (
          <div className="progress">
            <nav aria-label="Posting steps">
              {postingSteps.map((label, i) => (
                <button
                  type="button"
                  key={label}
                  aria-label={label}
                  aria-current={i === step ? "step" : undefined}
                  className={i <= step ? "completed" : ""}
                  disabled={busy || i > step}
                  onClick={() => {
                    setEditReturn(false);
                    move(i);
                  }}
                />
              ))}
            </nav>
            <div>
              <span>
                {postingSteps[step]}{" "}
                <span className="muted">{step + 1} of 6</span>
              </span>
              <span className="save-status" role="status">
                <Check size={14} />
                {draftStatus}
              </span>
            </div>
          </div>
        )}
        <div className="content">
          {error && (
            <p className="flow-error" role="alert">
              {error}
            </p>
          )}
          {Object.values(errors).some(Boolean) && (
            <p className="flow-error" role="alert">
              {Object.values(errors).filter(Boolean).join(" ")}
            </p>
          )}
          {done ? (
            <div className="success">
              <span className="success-icon">
                <Check size={30} />
              </span>
              <h1 ref={heading} tabIndex={-1}>
                Your listing looks great.
              </h1>
              <p>
                Listing saved on this device. Nothing has been published online.
              </p>
              <button className="primary" type="button" onClick={exit}>
                Back to exploring
              </button>
            </div>
          ) : (
            <>
              <h1 ref={heading} tabIndex={-1}>
                {
                  [
                    "What would you like to list?",
                    "Set your price and property size",
                    data.type === "PG"
                      ? "Tell us about the stay"
                      : isLand
                        ? "Describe the land"
                        : data.type === "Commercial"
                          ? "Describe the commercial space"
                          : "Tell us about the property",
                    "Help people picture the place",
                    "Where is the property?",
                    "Check what buyers will see",
                  ][step]
                }
              </h1>
              {step === 0 && (
                <>
                  <p className="intro">
                    Start with the basics. We’ll only ask for details relevant
                    to your property.
                  </p>
                  {notice && (
                    <p className="context-notice" role="status">
                      {notice}
                    </p>
                  )}
                  <fieldset>
                    <legend>I want to</legend>
                    <div className="intent">
                      {["SELL", "RENT"].map((value) => (
                        <button
                          type="button"
                          key={value}
                          className={data.intent === value ? "selected" : ""}
                          aria-pressed={data.intent === value}
                          onClick={() => choose("intent", value)}
                        >
                          {value === "SELL" ? (
                            <House size={26} />
                          ) : (
                            <KeyRound size={26} />
                          )}
                          <span>{value === "SELL" ? "Sell" : "Rent out"}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend>Property type</legend>
                    <div className="type-grid">
                      {(rent
                        ? [
                            "Independent House",
                            "Villa",
                            "Apartment",
                            "Commercial",
                            "PG",
                          ]
                        : [
                            "Land",
                            "Independent House",
                            "Villa",
                            "Apartment",
                            "Commercial",
                          ]
                      ).map((type) => {
                        const Icon = typeIcon(type);
                        return (
                          <button
                            type="button"
                            key={type}
                            className={data.type === type ? "selected" : ""}
                            aria-pressed={data.type === type}
                            onClick={() => choose("type", type)}
                          >
                            <Icon size={25} />
                            <span>{typeLabel(type)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                  {data.type === "Land" &&
                    choices("landType", "Land type", [
                      "Residential",
                      "Agricultural",
                      "Commercial",
                    ])}
                  {data.type === "Commercial" &&
                    choices("subtype", "Space type", commercialTypes(data))}
                  <section className="input-section">
                    {choices(
                      "seller",
                      "Posting as",
                      builderMayList(data)
                        ? ["Owner", "Agent", "Builder"]
                        : ["Owner", "Agent"],
                    )}
                    <p className="hint">
                      Your signed-in profile fills your contact details. You can
                      check or edit them before saving.
                    </p>
                  </section>
                </>
              )}
              {step === 1 && (
                <>
                  <p className="context">
                    {rent ? "Rent out" : "Sell"} ·{" "}
                    {data.type === "Commercial"
                      ? data.subtype
                      : typeLabel(data.type)}
                  </p>
                  {data.type === "PG" &&
                    choices("occupancy", "Room sharing", [
                      "Private room",
                      "Twin sharing",
                      "Triple sharing",
                    ])}
                  {field(
                    "price",
                    rent
                      ? data.type === "PG"
                        ? data.occupancy === "Private room"
                          ? "Monthly rent per room (₹)"
                          : "Monthly rent per bed (₹)"
                        : "Monthly rent (₹)"
                      : "Total asking price (₹)",
                    {
                      type: "number",
                      placeholder: rent ? "e.g. 18000" : "e.g. 4480000",
                    },
                  )}
                  <p className="amount-help">
                    {Number(data.price) > 0
                      ? `${money(data.price)} ${basis}`
                      : "Enter the amount in rupees."}
                  </p>
                  {field(
                    "area",
                    `${areaBasis(data)} (${isLand ? data.areaUnit : "sq ft"})`,
                    { type: "number", min: 0.01, placeholder: "Enter area" },
                  )}
                  {isLand &&
                    choices("areaUnit", "Area unit", [
                      "cents",
                      "sq ft",
                      ...(data.landType === "Agricultural" ? ["acres"] : []),
                    ])}
                  <p className="hint">
                    {Number(data.area) > 0
                      ? `${fmt(toSqft(data))} sq ft${isLand ? ` · ${fmt(toSqft(data) / 435.6)} cents` : ""}`
                      : "Use the measured property area; don’t guess."}
                  </p>
                  {choices(
                    "negotiable",
                    "Price negotiable",
                    [
                      ["", "Not specified"],
                      ["true", "Yes"],
                      ["false", "No"],
                    ],
                    true,
                  )}
                  {!!priceExtras(data).length && (
                    <section className="input-section">
                      <h2>
                        {rent
                          ? "Deposit & additional charges"
                          : "Additional charges"}
                      </h2>
                      <p className="hint">
                        Optional. Leave unknown amounts blank. Enter 0 only when
                        no charge applies.
                      </p>
                      {priceExtras(data).map(input)}
                    </section>
                  )}
                </>
              )}
              {step === 2 && (
                <>
                  <p className="intro">
                    Add what you know. Optional details can stay blank.
                  </p>
                  {groups.map((group) => (
                    <section className="input-section" key={group.title}>
                      <h2>{group.title}</h2>
                      {group.hint && <p className="hint">{group.hint}</p>}
                      {group.fields.map(input)}
                    </section>
                  ))}
                  {field("title", "Listing title", {
                    optional: true,
                    placeholder:
                      "Suggested from your locality and property type",
                  })}
                  <label className="field" htmlFor="post-description">
                    <span>
                      About the property <small>Optional</small>
                    </span>
                    <textarea
                      id="post-description"
                      value={data.description}
                      rows={4}
                      maxLength={2000}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="What should someone know before arranging a visit?"
                    />
                    <small className="hint">
                      Up to 2,000 characters. Leave contact details out of the
                      description.
                    </small>
                  </label>
                </>
              )}
              {step === 3 && (
                <>
                  <p className="intro">
                    Add 1–6 clear photos. The first photo becomes the cover.
                  </p>
                  <div className="photo-grid">
                    {data.photos.map((photo, i) => (
                      <div className="photo-item" key={i}>
                        <img
                          src={publicAsset(photo)}
                          alt={`Property photo ${i + 1}`}
                          width="200"
                          height="200"
                        />
                        <button
                          type="button"
                          className="remove-photo icon-button"
                          aria-label={`Remove photo ${i + 1}`}
                          onClick={() =>
                            set(
                              "photos",
                              data.photos.filter((_, index) => index !== i),
                            )
                          }
                        >
                          <X size={18} />
                        </button>
                        <button
                          type="button"
                          className={`cover ${i === 0 ? "is-cover" : ""}`}
                          onClick={() =>
                            set("photos", [
                              photo,
                              ...data.photos.filter((_, index) => index !== i),
                            ])
                          }
                        >
                          {i === 0 ? "Cover photo" : "Make cover"}
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="upload">
                    <Camera size={24} />
                    <strong>
                      {uploading ? "Preparing photos…" : "Add photos"}
                    </strong>
                    <span>JPG, PNG or WebP · up to 10 MB each</span>
                    <input
                      aria-label="Upload property photos"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={busy || data.photos.length >= 6}
                      onChange={upload}
                    />
                  </label>
                  <p className="hint">
                    Photos are stored on this device. No upload or publication
                    service is connected.
                  </p>
                </>
              )}
              {step === 4 && (
                <>
                  <p className="intro">
                    Choose a nearby city, then place the pin at the property.
                    We’ll look up its locality or village.
                  </p>
                  <Choices
                    id="post-near-city"
                    label="Start near"
                    value={data.city}
                    values={Object.keys(centers)}
                    onChange={(value) => {
                      setData((current) => ({
                        ...current,
                        city: value,
                        location: null,
                        locality: "",
                        address: "",
                      }));
                      setLookupPoint(null);
                      setLookup({ busy: false, message: "" });
                    }}
                  />
                  <Suspense
                    fallback={
                      <div
                        className="skeleton-line"
                        aria-label="Loading property map"
                      />
                    }
                  >
                    <PostLocationMap
                      key={data.location ? "pinned" : data.city}
                      city={data.city}
                      point={data.location}
                      onPick={pickPoint}
                      disabled={busy}
                    />
                  </Suspense>
                  <div className="map-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={gps}
                      disabled={busy}
                    >
                      <LocateFixed size={18} />
                      Use my current location
                    </button>
                  </div>
                  <p className="hint">
                    Tap the map or drag the pin. With a keyboard, use the map’s
                    arrow and +/− keys, then “Place pin at map centre”. Use
                    current location only if you’re at the property.
                  </p>
                  <p className="context-notice" role="status">
                    {lookup.message ||
                      (data.location
                        ? "Pin placed. Check the locality below."
                        : "Place a pin to fill the locality.")}
                  </p>
                  {field("locality", "Locality / village", {
                    placeholder: "Filled from the pin; correct it if needed",
                    readOnly: lookup.busy,
                  })}
                  {field("city", "City / town", { readOnly: lookup.busy })}
                  {data.seller === "Agent" ? (
                    <section className="input-section">
                      <h2>Location privacy</h2>
                      <p className="hint">
                        Only agent listings use location approval.
                      </p>
                      <Choices
                        id="post-privacy"
                        label="Before approval"
                        value={data.shareDefault?.mode || "hidden"}
                        values={[
                          ["hidden", "Hide the pin"],
                          ["radius", "Show approximate area"],
                        ]}
                        onChange={(mode) =>
                          set("shareDefault", { ...data.shareDefault, mode })
                        }
                      />
                      {data.shareDefault?.mode === "radius" && (
                        <Choices
                          id="post-radius"
                          label="Approximate radius"
                          value={data.shareDefault.radiusM || 500}
                          values={[
                            [300, "300 m"],
                            [500, "500 m"],
                            [1000, "1 km"],
                          ]}
                          onChange={(radiusM) =>
                            set("shareDefault", {
                              ...data.shareDefault,
                              radiusM,
                            })
                          }
                        />
                      )}
                    </section>
                  ) : (
                    <p className="note">
                      <MapPin size={20} />
                      Your exact property location will be visible on the owner
                      listing. Location approval is only for agent listings.
                    </p>
                  )}
                </>
              )}
              {step === 5 && (
                <>
                  <p className="intro">
                    Every value below comes from your inputs. Edit a section if
                    something is wrong.
                  </p>
                  <article className="listing-card">
                    {data.photos[0] && (
                      <img
                        src={publicAsset(data.photos[0])}
                        alt="Property cover"
                        width="200"
                        height="220"
                      />
                    )}
                    <div>
                      <h2>{payload.title}</h2>
                      <p className="card-price">{money(data.price)}</p>
                      <p>{basis}</p>
                      <p>
                        {fmt(toSqft(data))} sq ft ·{" "}
                        {areaBasis(data).toLowerCase()}
                      </p>
                      <p className="muted">{data.seller}</p>
                    </div>
                  </article>
                  {summary(
                    "Price & area",
                    1,
                    <>
                      <dl className="review-values">
                        <div>
                          <dt>
                            {rent ? "Monthly rent" : "Total asking price"}
                          </dt>
                          <dd>
                            {money(data.price)} {basis}
                          </dd>
                        </div>
                        <div>
                          <dt>{areaBasis(data)}</dt>
                          <dd>{fmt(toSqft(data))} sq ft</dd>
                        </div>
                        {data.type === "PG" && (
                          <div>
                            <dt>Occupancy</dt>
                            <dd>{data.occupancy}</dd>
                          </div>
                        )}
                        {present(data.negotiable) && (
                          <div>
                            <dt>Negotiable</dt>
                            <dd>{payload.negotiable ? "Yes" : "No"}</dd>
                          </div>
                        )}
                      </dl>
                      {reviewFields(priceExtras(data))}
                    </>,
                    LandPlot,
                  )}
                  {summary(
                    "Property details",
                    2,
                    <>
                      <p>
                        {typeLabel(data.type)}
                        {data.type === "Commercial" ? ` · ${data.subtype}` : ""}
                      </p>
                      {groups
                        .filter((group) =>
                          group.fields.some(
                            (f) =>
                              present(payload[f.key]) &&
                              (!Array.isArray(payload[f.key]) ||
                                payload[f.key].length),
                          ),
                        )
                        .map((group) => (
                          <div className="review-group" key={group.title}>
                            <h3>{group.title}</h3>
                            {reviewFields(group.fields)}
                          </div>
                        ))}
                      {data.description && (
                        <p className="review-description">{data.description}</p>
                      )}
                    </>,
                    House,
                  )}
                  {summary(
                    "Photos",
                    3,
                    <p>
                      {data.photos.length}{" "}
                      {data.photos.length === 1 ? "photo" : "photos"} · first
                      photo is the cover
                    </p>,
                    Camera,
                  )}
                  {summary(
                    "Location",
                    4,
                    <>
                      <p>
                        {data.locality}, {data.city}
                      </p>
                      <p className="hint">
                        {data.seller !== "Agent"
                          ? "Exact property location visible · no approval required"
                          : data.shareDefault?.mode === "radius"
                            ? `Approximate area · ${data.shareDefault.radiusM} m · exact pin after approval`
                            : "Pin hidden until approval"}
                      </p>
                    </>,
                    MapPin,
                  )}
                  <section className="contact-section">
                    <h2>
                      <User size={20} />
                      Your contact details
                    </h2>
                    <p className="hint">
                      Filled from your signed-in profile when available. Check
                      or edit before saving.
                    </p>
                    {field("contactName", "Contact name", {
                      placeholder: "Owner or agent name",
                    })}
                    {field("contactPhone", "Phone number", {
                      type: "tel",
                      placeholder: "10-digit Indian mobile",
                    })}
                    {field("whatsapp", "WhatsApp number", {
                      type: "tel",
                      optional: true,
                      placeholder: "Same as mobile if left blank",
                    })}
                  </section>
                  <p className="note">
                    <Info size={20} />
                    Saving keeps this listing on your device. Nothing is
                    published online.
                  </p>
                </>
              )}
              {step < 5 && (
                <button
                  type="button"
                  className="try-example"
                  onClick={sample}
                  disabled={busy}
                >
                  Autofill details
                </button>
              )}
            </>
          )}
          <div className="draft-tools">
            <button
              type="button"
              className="text-button"
              onClick={() => setDiscardOpen(true)}
              disabled={busy || done}
            >
              Discard draft
            </button>
          </div>
        </div>
        {!done && (
          <footer>
            {step > 0 && (
              <button
                type="button"
                className="secondary"
                onClick={() => move(step - 1)}
                disabled={busy}
              >
                Back
              </button>
            )}
            <button
              type="button"
              className="primary"
              disabled={busy || lookup.busy}
              onClick={submit}
            >
              {finishing
                ? "Saving…"
                : uploading
                  ? "Preparing photos…"
                  : !photosReady
                    ? "Restoring draft…"
                    : step === 5
                      ? "Save listing"
                      : editReturn
                        ? "Back to review"
                        : step === 4
                          ? "Review listing"
                          : "Continue"}
              {step === 5 ? <Check size={18} /> : <ChevronRight size={18} />}
            </button>
          </footer>
        )}
        {discardOpen && (
          <Modal
            title="Discard this draft?"
            onClose={() => setDiscardOpen(false)}
          >
            <p>This removes this unfinished draft from your device.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setDiscardOpen(false)}
              >
                Keep editing
              </button>
              <button
                type="button"
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
      </div>
    </section>
  );
}
