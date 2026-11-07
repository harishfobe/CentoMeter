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
import PropertyTypes, {
  typeLabel,
  WATER_SOURCES,
  PREFERRED_TENANTS,
  VILLA_AMENITIES,
} from "./PropertyTypes";
import {
  LandSummary,
  LandFields,
  LandAreaFields,
  PlotLandAreaFields,
} from "./LandDetails";
import { HouseVillaSummary } from "./HouseVillaDetails";
import {
  CommercialFacilities,
  CommercialHighlights,
  CommercialIncomeBadge,
  CommercialSummary,
  usesCommercialDetailLayout,
} from "./CommercialDetails";
import {
  PG_SERVICES,
  PgHighlights,
  PgServices,
  PgSummary,
  usesPgDetailLayout,
} from "./PgDetails";
import { facingDirections, supportsFacing, readLocal } from "./Discovery";
import MapView from "./MapView";
import { Modal, IconButton } from "./Modal";
import {
  isApartment,
  isIndependentHouse,
  isVilla,
} from "./propertyTypeIds";
import {
  COMMERCIAL_FACILITIES,
  COMMERCIAL_PARKING_OPTIONS,
  commercialFacilitiesFor,
  commercialSubtypesFor,
  CONDITION_OPTIONS,
  furnishingOptionsFor,
  normalizeCommercialSubtype,
  POSSESSION_OPTIONS,
  RENT_AVAILABLE_OPTIONS,
  ROAD_ACCESS_OPTIONS,
  LAND_ROAD_ACCESS_OPTIONS,
  DECLARATION_YES_NO_UNSURE,
  DECLARATION_YES_NO_NA_UNSURE,
} from "./listingFit";
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
    setData((d) => {
      const next = {
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
      };
      if (type !== "Independent House") {
        next.water = type === d.type ? d.water : "";
        if (type !== "Land") next.roadWidth = "";
        if (type !== d.type) next.plotArea = "";
      }
      if (type !== "Villa" && type !== d.type) {
        next.projectName = "";
        next.reraNumber = "";
        next.features = (d.features || []).filter(
          (f) => !VILLA_AMENITIES.includes(f),
        );
      }
      if (type !== "Commercial" && type !== d.type) {
        next.shopCount = "";
        next.monthlyRent = "";
        next.floorsLabel = "";
        next.roadAccess = "";
        next.powerBackup = "";
        next.waterSupply = "";
        next.facilities = [];
        next.frontage = "";
        next.washrooms = "";
        next.parking = "";
        next.suitableFor = "";
        next.commercialHighlights = [];
        if (type !== d.type) {
          const commercialFacilitySet = new Set([
            ...COMMERCIAL_FACILITIES,
            ...commercialFacilitiesFor("RENT"),
          ]);
          next.features = (next.features || []).filter(
            (f) => !commercialFacilitySet.has(f),
          );
        }
      }
      if (type === "Commercial" && type !== d.type) {
        next.subtype = normalizeCommercialSubtype(
          next.subtype,
          d.intent === "RENT" ? "RENT" : "BUY",
        );
        next.beds = "";
      }
      return next;
    });
    setError("");
  };
  const chooseIntent = (intent) => {
    setData((d) => {
      let type = intent === "SELL" && d.type === "PG" ? "Apartment" : d.type;
      // RENT no longer offers top-level Land — fold into Commercial · Land.
      if (intent === "RENT" && type === "Land") {
        type = "Commercial";
      }
      const next = {
        ...d,
        intent,
        type,
        ...Object.fromEntries(
          ["title", "description", "price"]
            .filter((key) => !dirty.current.has(key))
            .map((key) => [key, ""]),
        ),
      };
      if (type === "Commercial") {
        next.subtype = normalizeCommercialSubtype(
          intent === "RENT" && d.type === "Land" ? "Land" : d.subtype,
          intent === "RENT" ? "RENT" : "BUY",
        );
        if (intent !== d.intent) {
          next.facilities = [];
          next.features = [];
          next.parking = intent === "RENT" ? next.parking : "";
          next.carParking = intent === "RENT" ? "" : next.carParking;
        }
      }
      return next;
    });
    setError("");
  };
  const fillSample = () => {
    setData((d) => ({
      ...d,
      title:
        d.type === "Land"
          ? "A generous plot at Greenfield"
          : d.type === "PG"
            ? "Twin-sharing PG Room"
            : d.type === "Villa"
              ? "A gated villa at Lakeside Enclave"
              : d.type === "Independent House"
                ? "An independent house on Anna Nagar"
                : d.type === "Commercial"
                  ? d.intent === "RENT"
                    ? "Ground-floor Commercial Shop"
                    : "Income-generating Commercial Building"
                  : "A sunlit home at Parkside",
      price:
        d.type === "PG" && d.intent === "RENT"
          ? "9500"
          : d.type === "Commercial" && d.intent === "RENT"
            ? "35000"
            : d.intent === "RENT"
              ? "12000"
              : d.type === "Commercial"
                ? "28000000"
                : "7200000",
      area:
        d.type === "PG"
          ? "180"
          : d.intent === "RENT" && d.type === "Villa"
            ? "2100"
            : d.type === "Independent House" || d.type === "Villa"
              ? "1800"
              : d.type === "Commercial" && d.intent === "RENT"
                ? "650"
                : d.type === "Commercial"
                  ? "4000"
                  : d.intent === "RENT" && d.type === "Apartment"
                    ? "1150"
                    : "1200",
      builtUpArea:
        d.type === "Independent House" ||
        d.type === "Villa" ||
        d.type === "Apartment" ||
        d.type === "Commercial"
          ? d.type === "Commercial"
            ? d.intent === "RENT"
              ? "650"
              : "4000"
            : d.type === "Apartment"
              ? d.intent === "RENT"
                ? "1150"
                : "1200"
              : d.intent === "RENT" && d.type === "Villa"
                ? "2100"
                : "1800"
          : "",
      plotArea: d.type === "Independent House" ? "2400" : d.plotArea,
      water:
        d.type === "Independent House"
          ? d.intent === "RENT"
            ? "Borewell + Corporation"
            : "Siruvani"
          : d.water,
      roadWidth: d.type === "Independent House" ? "30" : d.roadWidth,
      projectName:
        d.type === "Villa" ? "Lakeside Enclave" : d.projectName || "",
      community: d.type === "Villa" ? "Gated" : d.community,
      reraNumber: d.type === "Villa" ? "TN/RERA/SAMPLE/0001" : d.reraNumber,
      address: city + " — sample central location",
      description:
        d.type === "Land"
          ? "Residential plot with road access and open views."
          : d.type === "Villa"
            ? "Gated community villa with shared amenities and 24/7 security."
            : d.type === "Independent House"
              ? "Standalone house on a private plot with road access."
              : d.type === "Commercial"
                ? d.intent === "RENT"
                  ? "Visible ground floor retail space with a wide frontage, suitable for shops, services or a compact showroom."
                  : "Income-generating commercial building with leased shops on a main road."
                : d.type === "PG"
                  ? "Managed PG accommodation with furnished rooms, meals and essential services for a convenient stay."
                  : "A bright property close to everyday conveniences.",
      photos: d.type === "Land" ? ["/land.jpg"] : ["/apartment.jpg"],
      location: centers[city],
      landType: d.type === "Land" ? "Residential" : d.landType,
      subtype:
        d.type === "Commercial"
          ? normalizeCommercialSubtype(
              d.subtype,
              d.intent === "RENT" ? "RENT" : "BUY",
            )
          : d.type === "Land"
            ? d.landType || "Residential"
            : d.subtype,
      shopCount:
        d.type === "Commercial" && d.intent !== "RENT" ? "6" : d.shopCount,
      monthlyRent:
        d.type === "Commercial" && d.intent !== "RENT" ? "165000" : d.monthlyRent,
      floorsLabel:
        d.type === "Commercial" && d.intent !== "RENT"
          ? "G+2"
          : d.type === "Independent House" || d.type === "Villa"
            ? d.floorsLabel || "G+1"
            : d.floorsLabel,
      totalFloors:
        d.type === "Commercial" && d.intent !== "RENT"
          ? "3"
          : d.type === "Apartment"
            ? "12"
            : d.totalFloors,
      floor:
        d.type === "Commercial" && d.intent === "RENT"
          ? "Ground"
          : d.type === "Apartment"
            ? "5"
            : d.floor,
      carpetArea:
        d.type === "Commercial" && d.intent === "RENT"
          ? "650"
          : d.type === "Apartment"
            ? d.intent === "RENT"
              ? "920"
              : "960"
            : d.type === "Independent House" || d.type === "Villa"
              ? "1500"
              : d.carpetArea,
      frontage:
        d.type === "Commercial" && d.intent === "RENT" ? "18" : d.frontage,
      washrooms:
        d.type === "Commercial" && d.intent === "RENT" ? "1" : d.washrooms,
      parking:
        d.type === "Commercial" && d.intent === "RENT" ? "Common" : d.parking,
      suitableFor:
        d.type === "Commercial" && d.intent === "RENT"
          ? "Retail / Showroom"
          : d.suitableFor,
      commercialHighlights:
        d.type === "Commercial" && d.intent === "RENT"
          ? ["Ground floor", "Main road", "High footfall", "Wide frontage"]
          : d.commercialHighlights,
      balconies:
        d.type === "Apartment"
          ? "1"
          : d.intent === "RENT" && d.type === "Villa"
            ? "2"
            : d.balconies,
      carParking:
        d.type === "Commercial"
          ? d.intent === "RENT"
            ? "Available"
            : "Available"
          : d.intent === "RENT" &&
              (d.type === "Independent House" || d.type === "Villa")
            ? "2"
            : d.type === "Apartment" ||
                d.type === "Independent House" ||
                d.type === "Villa"
              ? "1"
              : d.carParking,
      furnishing:
        d.type === "Land"
          ? d.furnishing
          : d.type === "PG"
            ? "Fully furnished"
            : d.type === "Commercial" && d.intent === "RENT"
              ? "Bare shell"
              : "Semi-furnished",
      condition:
        d.type === "Land" ? d.condition : "Resale",
      possessionStatus:
        d.type === "Land" ? d.possessionStatus : "Ready to move",
      ownershipType:
        d.type === "Land" ? d.ownershipType : "Freehold",
      negotiable: true,
      roadAccess: d.type === "Commercial" ? "Main road" : d.roadAccess,
      powerBackup: d.type === "Commercial" ? "Available" : d.powerBackup,
      waterSupply: d.type === "Commercial" ? "Available" : d.waterSupply,
      facilities:
        d.type === "Commercial"
          ? d.intent === "RENT"
            ? ["CCTV", "Power backup", "Common parking", "Water supply"]
            : [...COMMERCIAL_FACILITIES]
          : d.facilities,
      occupancy: d.type === "PG" ? "Twin sharing" : "Private room",
      meals: d.type === "PG" ? "Included" : "Not included",
      bathroom: "Attached",
      ac: d.type === "PG" ? "Yes" : "No",
      housekeeping: d.type === "PG" ? "Included" : d.housekeeping,
      electricity: d.type === "PG" ? "As per usage" : d.electricity,
      noticePeriod: d.type === "PG" ? "1 month" : d.noticePeriod,
      preferredTenant:
        d.type === "PG"
          ? "Working professionals"
          : d.intent === "RENT" &&
              (d.type === "Villa" || d.type === "Independent House")
            ? "Family"
            : d.intent === "RENT" && d.type === "Apartment"
              ? "Family / Professionals"
              : d.preferredTenant,
      pets:
        d.intent === "RENT" &&
        (d.type === "Villa" || d.type === "Independent House")
          ? "Allowed"
          : d.intent === "RENT" && d.type === "Apartment"
            ? "Not specified"
            : d.pets,
      available:
        d.intent === "RENT" && d.type === "Commercial"
          ? "Immediately"
          : d.intent === "RENT" &&
              (d.type === "Villa" ||
                d.type === "Apartment" ||
                d.type === "Independent House" ||
                d.type === "PG")
            ? "Ready now"
            : d.available,
      services: d.type === "PG" ? [...PG_SERVICES] : d.services,
      pgHighlights:
        d.type === "PG"
          ? [
              "Meals included",
              "Wi-Fi",
              "Housekeeping",
              "Attached bathroom",
            ]
          : d.pgHighlights,
      baths:
        d.intent === "RENT" && d.type === "Apartment"
          ? 2
          : d.intent === "RENT" &&
              (d.type === "Villa" || d.type === "Independent House")
            ? 3
            : 1,
      beds:
        d.intent === "RENT" && d.type === "Apartment"
          ? "2"
          : d.intent === "RENT" &&
              (d.type === "Villa" || d.type === "Independent House")
            ? "3"
            : d.beds,
      features:
        d.type === "Villa"
          ? ["Clubhouse", "Security", "Pool", "Power Backup"]
          : d.type === "Commercial"
            ? d.intent === "RENT"
              ? ["CCTV", "Power backup", "Common parking", "Water supply"]
              : [...COMMERCIAL_FACILITIES]
            : d.type === "PG"
              ? ["Wi-Fi", "Housekeeping", "Attached bathroom"]
              : ["Parking"],
      deposit:
        d.type === "PG"
          ? "10000"
          : d.type === "Commercial" && d.intent === "RENT"
            ? "200000"
            : d.intent === "RENT"
              ? "24000"
              : "",
      maintenance:
        d.intent === "RENT" && d.type === "Independent House"
          ? ""
          : d.type === "Commercial" && d.intent === "RENT"
            ? "2000"
            : d.intent === "RENT"
              ? "1000"
              : d.type === "Apartment"
                ? "2500"
                : d.maintenance || "",
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
    if (step === 1 && isIndependentHouse(data.type)) {
      if (!(Number(data.plotArea) > 0)) {
        setError("Enter the land area in cents or sq ft.");
        return;
      }
      if (!WATER_SOURCES.includes(data.water)) {
        setError(
          "Select a water source (Siruvani, Corporation, Borewell, or Borewell + Corporation).",
        );
        return;
      }
      if (!(Number(data.roadWidth) > 0)) {
        setError("Enter the road width in feet.");
        return;
      }
    }
    if (step === 1 && isVilla(data.type)) {
      if (!String(data.projectName || "").trim()) {
        setError("Enter the project or community name.");
        return;
      }
      if (
        !VILLA_AMENITIES.some((item) => (data.features || []).includes(item))
      ) {
        setError(
          "Select at least one gated-community amenity (Clubhouse, Security, Pool, or Power Backup).",
        );
        return;
      }
      if (!String(data.reraNumber || "").trim()) {
        setError("Enter the RERA registration number.");
        return;
      }
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
                  {data.intent === "RENT"
                    ? "Monthly rent (₹)"
                    : data.type === "Land"
                      ? "Asking price (₹ total)"
                      : "Asking price (₹)"}
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter amount"
                    value={data.price}
                    onChange={(e) => set("price", e.target.value)}
                    aria-invalid={
                      data.price !== "" && !(Number(data.price) > 0)
                    }
                  />
                </label>
                {data.type === "Land" ? (
                  <LandAreaFields data={data} set={set} />
                ) : (
                  <label>
                    {data.type === "Commercial" && data.intent === "RENT"
                      ? data.subtype === "Land"
                        ? "Plot area (sq ft)"
                        : "Carpet area (sq ft)"
                      : isIndependentHouse(data.type) ||
                          isVilla(data.type) ||
                          isApartment(data.type) ||
                          data.type === "Commercial"
                        ? "Built-up area (sq ft)"
                        : "Area (sq ft)"}
                    <input
                      type="number"
                      min="1"
                      placeholder="Enter area"
                      value={
                        data.type === "Commercial" &&
                        data.intent === "RENT" &&
                        data.subtype !== "Land" &&
                        data.carpetArea
                          ? data.carpetArea
                          : data.area
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          data.type === "Commercial" &&
                          data.intent === "RENT"
                        ) {
                          dirty.current.add("area");
                          dirty.current.add("carpetArea");
                          setData((d) => ({
                            ...d,
                            area: value,
                            // Keep carpet and built-up distinct — only set the
                            // field the user is editing (carpet for Shop/Office).
                            carpetArea:
                              d.subtype === "Land" ? d.carpetArea : value,
                          }));
                          setError("");
                          return;
                        }
                        if (
                          isIndependentHouse(data.type) ||
                          isVilla(data.type) ||
                          isApartment(data.type) ||
                          data.type === "Commercial"
                        ) {
                          dirty.current.add("area");
                          dirty.current.add("builtUpArea");
                          setData((d) => ({
                            ...d,
                            area: value,
                            builtUpArea: value,
                          }));
                          setError("");
                          return;
                        }
                        set("area", value);
                      }}
                    />
                  </label>
                )}
              </div>
              {data.type === "Commercial" && (
                <>
                  <div className="form-columns">
                    <label>
                      Space type
                      <select
                        value={normalizeCommercialSubtype(
                          data.subtype,
                          data.intent === "RENT" ? "RENT" : "BUY",
                        )}
                        onChange={(e) => set("subtype", e.target.value)}
                      >
                        {commercialSubtypesFor(
                          data.intent === "RENT" ? "RENT" : "BUY",
                        ).map((subtype) => (
                          <option key={subtype}>{subtype}</option>
                        ))}
                      </select>
                      {data.intent === "RENT" ? (
                        <small>Land, Shop, or Office Space</small>
                      ) : null}
                    </label>
                    {data.subtype !== "Land" && data.intent !== "RENT" ? (
                      <label>
                        Floors
                        <input
                          maxLength={12}
                          placeholder="e.g. G+2"
                          value={data.floorsLabel || ""}
                          onChange={(e) => set("floorsLabel", e.target.value)}
                        />
                      </label>
                    ) : data.subtype !== "Land" ? (
                      <label>
                        Floor
                        <input
                          placeholder="e.g. Ground"
                          value={data.floor || ""}
                          onChange={(e) => set("floor", e.target.value)}
                        />
                      </label>
                    ) : (
                      <label>
                        Road access
                        <select
                          value={data.roadAccess || ""}
                          onChange={(e) => set("roadAccess", e.target.value)}
                        >
                          <option value="">Select</option>
                          {ROAD_ACCESS_OPTIONS.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  {data.intent === "RENT" && data.subtype !== "Land" && (
                    <div className="form-columns">
                      <label>
                        Frontage (ft)
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 18"
                          value={data.frontage ?? ""}
                          onChange={(e) => set("frontage", e.target.value)}
                        />
                      </label>
                      <label>
                        Washrooms
                        <input
                          type="number"
                          min="0"
                          max="20"
                          placeholder="e.g. 1"
                          value={data.washrooms ?? ""}
                          onChange={(e) => set("washrooms", e.target.value)}
                        />
                      </label>
                    </div>
                  )}
                  {data.intent === "RENT" && data.subtype !== "Land" && (
                    <div className="form-columns">
                      <label>
                        Suitable for
                        <input
                          placeholder="e.g. Retail / Showroom"
                          value={data.suitableFor || ""}
                          onChange={(e) => set("suitableFor", e.target.value)}
                        />
                      </label>
                      <label>
                        Available from
                        <select
                          value={data.available || ""}
                          onChange={(e) => set("available", e.target.value)}
                        >
                          <option value="">Select</option>
                          {RENT_AVAILABLE_OPTIONS.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                  {data.intent === "RENT" && data.subtype === "Land" && (
                    <div className="form-columns">
                      <label>
                        Suitable for
                        <input
                          placeholder="e.g. Commercial development"
                          value={data.suitableFor || ""}
                          onChange={(e) => set("suitableFor", e.target.value)}
                        />
                      </label>
                      <label>
                        Available from
                        <select
                          value={data.available || ""}
                          onChange={(e) => set("available", e.target.value)}
                        >
                          <option value="">Select</option>
                          {RENT_AVAILABLE_OPTIONS.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                  {data.subtype !== "Land" && data.intent === "SELL" && (
                    <div className="form-columns">
                      <label>
                        Number of shops
                        <input
                          type="number"
                          min="0"
                          max="200"
                          placeholder="e.g. 6"
                          value={data.shopCount ?? ""}
                          onChange={(e) => set("shopCount", e.target.value)}
                        />
                      </label>
                      <label>
                        Monthly rental income (₹)
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 165000"
                          value={data.monthlyRent ?? ""}
                          onChange={(e) => set("monthlyRent", e.target.value)}
                        />
                      </label>
                    </div>
                  )}
                  <div className="form-columns">
                    {data.intent === "RENT" ? (
                      <label>
                        Parking
                        <select
                          value={data.parking || ""}
                          onChange={(e) => set("parking", e.target.value)}
                        >
                          <option value="">Select</option>
                          {COMMERCIAL_PARKING_OPTIONS.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label>
                        Car parking
                        <select
                          value={data.carParking || ""}
                          onChange={(e) => set("carParking", e.target.value)}
                        >
                          <option value="">Select</option>
                          <option value="Available">Available</option>
                          <option value="Not available">Not available</option>
                        </select>
                      </label>
                    )}
                    {data.subtype !== "Land" ? (
                      <label>
                        Road access
                        <select
                          value={data.roadAccess || ""}
                          onChange={(e) => set("roadAccess", e.target.value)}
                        >
                          <option value="">Select</option>
                          {ROAD_ACCESS_OPTIONS.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label>
                        Power backup
                        <select
                          value={data.powerBackup || ""}
                          onChange={(e) => set("powerBackup", e.target.value)}
                        >
                          <option value="">Select</option>
                          <option>Available</option>
                          <option>Not available</option>
                        </select>
                      </label>
                    )}
                  </div>
                  {data.subtype !== "Land" && (
                    <div className="form-columns">
                      <label>
                        Power backup
                        <select
                          value={data.powerBackup || ""}
                          onChange={(e) => set("powerBackup", e.target.value)}
                        >
                          <option value="">Select</option>
                          <option>Available</option>
                          <option>Not available</option>
                        </select>
                      </label>
                      <label>
                        Water supply
                        <select
                          value={data.waterSupply || ""}
                          onChange={(e) => set("waterSupply", e.target.value)}
                        >
                          <option value="">Select</option>
                          <option>Available</option>
                          <option>Not available</option>
                        </select>
                      </label>
                    </div>
                  )}
                </>
              )}
              {isApartment(data.type) && (
                <>
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
                      Balconies
                      <input
                        type="number"
                        min="0"
                        max="20"
                        placeholder="e.g. 1"
                        value={data.balconies ?? ""}
                        onChange={(e) => set("balconies", e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="form-columns">
                    <label>
                      Floor
                      <input
                        placeholder="e.g. 5"
                        value={data.floor ?? ""}
                        onChange={(e) => set("floor", e.target.value)}
                      />
                    </label>
                    <label>
                      Total floors
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 12"
                        value={data.totalFloors ?? ""}
                        onChange={(e) => set("totalFloors", e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="form-columns">
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
                    </label>
                    <label>
                      Monthly maintenance (₹)
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 2500"
                        value={data.maintenance ?? ""}
                        onChange={(e) => set("maintenance", e.target.value)}
                      />
                    </label>
                  </div>
                  {data.intent === "RENT" && (
                    <div className="form-columns">
                      <label>
                        Preferred tenant
                        <select
                          value={data.preferredTenant || ""}
                          onChange={(e) =>
                            set("preferredTenant", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          {PREFERRED_TENANTS.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Pets
                        <select
                          value={data.pets || ""}
                          onChange={(e) => set("pets", e.target.value)}
                        >
                          <option value="">Select</option>
                          <option>Allowed</option>
                          <option>Not allowed</option>
                          <option>Not specified</option>
                        </select>
                      </label>
                    </div>
                  )}
                </>
              )}
              {isIndependentHouse(data.type) && (
                <>
                  <PlotLandAreaFields data={data} set={set} />
                  <div className="form-columns">
                    <label>
                      Water source
                      <select
                        value={data.water || ""}
                        onChange={(e) => set("water", e.target.value)}
                        required
                      >
                        <option value="">Select</option>
                        {WATER_SOURCES.map((source) => (
                          <option key={source}>{source}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Road width (ft)
                      <input
                        type="number"
                        min="1"
                        step="any"
                        inputMode="decimal"
                        placeholder="e.g. 30"
                        value={data.roadWidth ?? ""}
                        onChange={(e) => set("roadWidth", e.target.value)}
                        required
                      />
                    </label>
                  </div>
                  {data.intent === "RENT" && (
                    <div className="form-columns">
                      <label>
                        Preferred tenant
                        <select
                          value={data.preferredTenant || ""}
                          onChange={(e) =>
                            set("preferredTenant", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          {PREFERRED_TENANTS.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Pets
                        <select
                          value={data.pets || ""}
                          onChange={(e) => set("pets", e.target.value)}
                        >
                          <option value="">Select</option>
                          <option>Allowed</option>
                          <option>Not allowed</option>
                          <option>Not specified</option>
                        </select>
                      </label>
                    </div>
                  )}
                </>
              )}
              {isVilla(data.type) && (
                <>
                  <label>
                    Project / community name
                    <input
                      maxLength={80}
                      placeholder="Gated community or layout name"
                      value={data.projectName || ""}
                      onChange={(e) => set("projectName", e.target.value)}
                      required
                    />
                    <small>Inside a gated community / layout</small>
                  </label>
                  <fieldset className="land-highlight-options">
                    <legend>Community amenities</legend>
                    <div className="chips">
                      {VILLA_AMENITIES.map((feature) => (
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
                  <label>
                    RERA registration number
                    <input
                      maxLength={40}
                      placeholder="TN/RERA/…"
                      value={data.reraNumber || ""}
                      onChange={(e) => set("reraNumber", e.target.value)}
                      required
                    />
                  </label>
                  {data.intent === "RENT" && (
                    <>
                      <div className="form-columns">
                        <label>
                          Balconies
                          <input
                            type="number"
                            min="0"
                            max="20"
                            placeholder="Number of balconies"
                            value={data.balconies ?? ""}
                            onChange={(e) => set("balconies", e.target.value)}
                          />
                        </label>
                        <label>
                          Community
                          <select
                            value={data.community || "Gated"}
                            onChange={(e) => set("community", e.target.value)}
                          >
                            <option>Gated</option>
                            <option>Open layout</option>
                          </select>
                        </label>
                      </div>
                      <div className="form-columns">
                        <label>
                          Preferred tenant
                          <select
                            value={data.preferredTenant || ""}
                            onChange={(e) =>
                              set("preferredTenant", e.target.value)
                            }
                          >
                            <option value="">Select</option>
                            {PREFERRED_TENANTS.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Pets
                          <select
                            value={data.pets || ""}
                            onChange={(e) => set("pets", e.target.value)}
                          >
                            <option value="">Select</option>
                            <option>Allowed</option>
                            <option>Not allowed</option>
                            <option>Not specified</option>
                          </select>
                        </label>
                      </div>
                    </>
                  )}
                </>
              )}
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
              {data.type === "Land" && (
                <div className="land-post-progressive">
                  <label>
                    Poster role
                    <select
                      value={
                        data.posterRole ||
                        (agent ? "Agent" : data.seller || "Owner")
                      }
                      onChange={(e) => {
                        set("posterRole", e.target.value);
                        set("seller", e.target.value);
                      }}
                    >
                      <option>Owner</option>
                      <option>Agent</option>
                      <option>Builder</option>
                    </select>
                    {agent ? (
                      <small>Inherited from your agent profile when blank.</small>
                    ) : null}
                  </label>
                  <LandFields data={data} set={set} />
                  <section
                    className="land-declarations"
                    aria-label="Land declarations"
                  >
                    <h3>Land declarations</h3>
                    <p className="fine-print">
                      These are seller-provided declarations and have not been
                      independently verified by CentoMeter.
                    </p>
                    <div className="form-columns">
                      <label>
                        Patta available
                        <select
                          value={data.pattaAvailable || ""}
                          onChange={(e) =>
                            set("pattaAvailable", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          {DECLARATION_YES_NO_UNSURE.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Planning / layout approval
                        <select
                          value={data.planningApproval || ""}
                          onChange={(e) =>
                            set("planningApproval", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          {DECLARATION_YES_NO_NA_UNSURE.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="form-columns">
                      <label>
                        RERA registered
                        <select
                          value={data.reraRegistered || ""}
                          onChange={(e) =>
                            set("reraRegistered", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          {DECLARATION_YES_NO_NA_UNSURE.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Road access
                        <select
                          value={data.roadAccess || ""}
                          onChange={(e) => set("roadAccess", e.target.value)}
                        >
                          <option value="">Select</option>
                          {LAND_ROAD_ACCESS_OPTIONS.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </section>
                  <details className="land-recommended-details">
                    <summary>Add recommended details</summary>
                    <div className="form-stack">
                      <div className="form-columns">
                        <label>
                          Road width (ft)
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Optional"
                            value={data.roadWidth || ""}
                            onChange={(e) => set("roadWidth", e.target.value)}
                          />
                        </label>
                        <label>
                          Water availability
                          <select
                            value={data.water || ""}
                            onChange={(e) => set("water", e.target.value)}
                          >
                            <option value="">Select</option>
                            {WATER_SOURCES.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                            <option>Not sure</option>
                          </select>
                        </label>
                      </div>
                      {(data.landType || data.subtype) === "Agricultural" ? (
                        <label>
                          Irrigation
                          <select
                            value={data.irrigation || ""}
                            onChange={(e) => set("irrigation", e.target.value)}
                          >
                            <option value="">Select</option>
                            <option>Available</option>
                            <option>Not available</option>
                            <option>Not sure</option>
                          </select>
                        </label>
                      ) : null}
                      <div className="form-columns">
                        <label>
                          Electricity
                          <select
                            value={data.electricity || ""}
                            onChange={(e) => set("electricity", e.target.value)}
                          >
                            <option value="">Select</option>
                            <option>Available</option>
                            <option>Not available</option>
                            <option>Not sure</option>
                          </select>
                        </label>
                        <label>
                          Negotiable
                          <select
                            value={
                              data.negotiable === true
                                ? "Yes"
                                : data.negotiable === false
                                  ? "No"
                                  : data.negotiable || ""
                            }
                            onChange={(e) => {
                              const v = e.target.value;
                              set(
                                "negotiable",
                                v === "Yes" ? true : v === "No" ? false : v,
                              );
                            }}
                          >
                            <option value="">Select</option>
                            <option>Yes</option>
                            <option>No</option>
                            <option>Not sure</option>
                          </select>
                        </label>
                      </div>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={!!data.cornerPlot}
                          onChange={(e) => set("cornerPlot", e.target.checked)}
                        />
                        Corner plot
                      </label>
                    </div>
                  </details>
                </div>
              )}
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
                  {!isApartment(data.type) &&
                    !isIndependentHouse(data.type) && (
                    <label>
                      Monthly maintenance (₹)
                      <input
                        type="number"
                        min="0"
                        value={data.maintenance ?? ""}
                        onChange={(e) => set("maintenance", e.target.value)}
                      />
                    </label>
                  )}
                </div>
              )}
              {data.type === "PG" && (
                <>
                  <div className="form-columns">
                    {[
                      [
                        "occupancy",
                        "Occupancy",
                        ["Private room", "Twin sharing", "Triple sharing"],
                      ],
                      ["meals", "Meals", ["Included", "Not included"]],
                      ["bathroom", "Bathroom", ["Attached", "Shared"]],
                      ["ac", "Air conditioning", ["Yes", "No"]],
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
                  <div className="form-columns">
                    <label>
                      Housekeeping
                      <select
                        value={data.housekeeping || ""}
                        onChange={(e) => set("housekeeping", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option>Included</option>
                        <option>Not included</option>
                      </select>
                    </label>
                    <label>
                      Electricity
                      <select
                        value={data.electricity || ""}
                        onChange={(e) => set("electricity", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option>As per usage</option>
                        <option>Included</option>
                      </select>
                    </label>
                  </div>
                  <div className="form-columns">
                    <label>
                      Preferred tenant
                      <select
                        value={data.preferredTenant || ""}
                        onChange={(e) =>
                          set("preferredTenant", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        {PREFERRED_TENANTS.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Notice period
                      <select
                        value={data.noticePeriod || ""}
                        onChange={(e) => set("noticePeriod", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option>15 days</option>
                        <option>1 month</option>
                        <option>2 months</option>
                      </select>
                    </label>
                  </div>
                  <fieldset className="land-highlight-options">
                    <legend>Services</legend>
                    <div className="chips">
                      {PG_SERVICES.map((service) => (
                        <button
                          type="button"
                          key={service}
                          className={
                            "chip " +
                            ((data.services || []).includes(service)
                              ? "active"
                              : "")
                          }
                          aria-pressed={(data.services || []).includes(service)}
                          onClick={() =>
                            set(
                              "services",
                              (data.services || []).includes(service)
                                ? data.services.filter((x) => x !== service)
                                : [...(data.services || []), service],
                            )
                          }
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </>
              )}
              {data.type !== "Land" && data.type !== "Commercial" && (
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
              )}
              {data.type === "Commercial" ? (
                <fieldset className="land-highlight-options">
                  <legend>
                    {data.intent === "RENT"
                      ? "Amenities & facilities"
                      : "Facilities"}
                  </legend>
                  <div className="chips">
                    {commercialFacilitiesFor(
                      data.intent === "RENT" ? "RENT" : "BUY",
                    ).map((feature) => {
                      const selected = (
                        data.facilities?.length
                          ? data.facilities
                          : data.features || []
                      ).includes(feature);
                      return (
                        <button
                          type="button"
                          key={feature}
                          className={"chip " + (selected ? "active" : "")}
                          aria-pressed={selected}
                          onClick={() => {
                            const current = data.facilities?.length
                              ? data.facilities
                              : data.features || [];
                            const next = selected
                              ? current.filter((x) => x !== feature)
                              : [...current, feature];
                            dirty.current.add("facilities");
                            dirty.current.add("features");
                            setData((d) => ({
                              ...d,
                              facilities: next,
                              features: next,
                            }));
                            setError("");
                          }}
                        >
                          {feature}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ) : !["Land", "Villa", "Independent House"].includes(
                  data.type,
                ) ? (
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
              ) : null}
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
              {!["Land", "PG"].includes(data.type) && (
                <div className="form-columns">
                  <label>
                    Furnishing
                    <select
                      value={data.furnishing || ""}
                      onChange={(e) => set("furnishing", e.target.value)}
                    >
                      <option value="">Select</option>
                      {furnishingOptionsFor(data.type).map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  {data.intent !== "RENT" || data.type !== "Commercial" ? (
                    <label>
                      Condition
                      <select
                        value={data.condition || ""}
                        onChange={(e) => set("condition", e.target.value)}
                      >
                        <option value="">Select</option>
                        {CONDITION_OPTIONS.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              )}
              {!["Land", "PG"].includes(data.type) &&
                !(data.type === "Commercial" && data.intent === "RENT") && (
                <div className="form-columns">
                  <label>
                    Possession
                    <select
                      value={data.possessionStatus || ""}
                      onChange={(e) => set("possessionStatus", e.target.value)}
                    >
                      <option value="">Select</option>
                      {POSSESSION_OPTIONS.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Ownership
                    <select
                      value={data.ownershipType || ""}
                      onChange={(e) => set("ownershipType", e.target.value)}
                    >
                      <option value="">Select</option>
                      <option>Freehold</option>
                      <option>Leasehold</option>
                    </select>
                  </label>
                </div>
              )}
              {data.intent === "SELL" && data.type !== "Land" && (
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={
                      data.negotiable === true ||
                      /^yes$/i.test(String(data.negotiable || ""))
                    }
                    onChange={(e) => set("negotiable", e.target.checked)}
                  />
                  Price negotiable
                </label>
              )}
              {!isVilla(data.type) && (
                <OptionalListingFields
                  data={data}
                  set={set}
                  hideFields={
                    isApartment(data.type)
                      ? [
                          "possessionStatus",
                          "totalFloors",
                          "parking",
                          "ownershipType",
                        ]
                      : data.type === "Commercial"
                        ? [
                            "possessionStatus",
                            "totalFloors",
                            "parking",
                            "ownershipType",
                          ]
                        : isIndependentHouse(data.type)
                          ? ["possessionStatus", "ownershipType", "parking"]
                          : []
                  }
                />
              )}
              {isVilla(data.type) && (
                <OptionalListingFields
                  data={data}
                  set={set}
                  hideFields={[
                    "reraNumber",
                    "possessionStatus",
                    "ownershipType",
                    "parking",
                  ]}
                />
              )}
              <label>
                About the property
                <textarea
                  rows="4"
                  maxLength={2000}
                  placeholder={
                    data.type === "Land"
                      ? "Describe access, nearby landmarks, approvals and what makes this land useful"
                      : "Share extra details buyers should know — layout, neighbourhood, visit tips"
                  }
                  value={data.description}
                  onChange={(e) => set("description", e.target.value)}
                />
                <small>
                  Optional · up to 2000 characters · shown on the listing page
                </small>
              </label>
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
                <LandSummary
                  p={{
                    ...data,
                    mode: data.intent === "RENT" ? "RENT" : "BUY",
                  }}
                  showDescription={false}
                />
              ) : usesCommercialDetailLayout({
                  ...data,
                  mode: data.intent === "RENT" ? "RENT" : "BUY",
                }) ? (
                <>
                  {data.intent !== "RENT" ? (
                    <CommercialIncomeBadge
                      p={{
                        ...data,
                        mode: "BUY",
                      }}
                    />
                  ) : null}
                  <CommercialSummary
                    p={{
                      ...data,
                      mode: data.intent === "RENT" ? "RENT" : "BUY",
                      facilities: data.facilities?.length
                        ? data.facilities
                        : data.features,
                    }}
                  />
                  <CommercialHighlights
                    p={{
                      ...data,
                      mode: data.intent === "RENT" ? "RENT" : "BUY",
                    }}
                  />
                </>
              ) : ["Apartment", "Independent House", "Villa"].includes(
                  data.type,
                ) ? (
                <HouseVillaSummary
                  p={{
                    ...data,
                    mode: data.intent === "RENT" ? "RENT" : "BUY",
                  }}
                />
              ) : usesPgDetailLayout({
                  ...data,
                  mode: data.intent === "RENT" ? "RENT" : "BUY",
                }) ? (
                <>
                  <PgSummary
                    p={{
                      ...data,
                      mode: "RENT",
                    }}
                  />
                  <PgHighlights
                    p={{
                      ...data,
                      mode: "RENT",
                    }}
                  />
                </>
              ) : null}
              {data.description?.trim() ? (
                <section
                  className="about-the-property"
                  aria-label="About the property"
                >
                  <h3>About the property</h3>
                  <p className="description">{data.description.trim()}</p>
                </section>
              ) : null}
              {usesCommercialDetailLayout({
                ...data,
                mode: data.intent === "RENT" ? "RENT" : "BUY",
              }) ? (
                <CommercialFacilities
                  p={{
                    ...data,
                    mode: "BUY",
                    facilities: data.facilities?.length
                      ? data.facilities
                      : data.features,
                  }}
                />
              ) : null}
              {usesPgDetailLayout({
                ...data,
                mode: data.intent === "RENT" ? "RENT" : "BUY",
              }) ? (
                <PgServices
                  p={{
                    ...data,
                    mode: "RENT",
                  }}
                />
              ) : null}
              {data.type !== "Land" &&
                !usesCommercialDetailLayout({
                  ...data,
                  mode: data.intent === "RENT" ? "RENT" : "BUY",
                }) &&
                !usesPgDetailLayout({
                  ...data,
                  mode: data.intent === "RENT" ? "RENT" : "BUY",
                }) &&
                supportsFacing(data.type) && (
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
