await Promise.all(
  ["Regular", "Medium", "Semi Bold", "Bold"].map((style) =>
    figma.loadFontAsync({ family: "Inter", style }),
  ),
);
const page = figma.currentPage;
page.name = "CentoMeter • Refined Experience";
const created = [],
  slots = [],
  roots = [];
const palette = {
  ink: "#1c2522",
  muted: "#68736e",
  border: "#e3e9e5",
  surface: "#ffffff",
  canvas: "#f7f8f6",
  accent: "#c24a0e",
  soft: "#fff4e9",
  green: "#edf6f0",
};
const rgb = (h) => ({
  r: parseInt(h.slice(1, 3), 16) / 255,
  g: parseInt(h.slice(3, 5), 16) / 255,
  b: parseInt(h.slice(5, 7), 16) / 255,
});
const collection = figma.variables.createVariableCollection("CentoMeter / UI");
collection.renameMode(collection.defaultModeId, "Default");
const variables = {};
for (const [key, value] of Object.entries(palette)) {
  const v = figma.variables.createVariable(key, collection, "COLOR");
  v.scopes = ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"];
  v.setValueForMode(collection.defaultModeId, rgb(value));
  variables[key] = v;
}
const buttonSet = await figma.importComponentSetByKeyAsync(
  "cc8b558dc7d9684011b6b99ce8e6509399bc836b",
);
const inputSet = await figma.importComponentSetByKeyAsync(
  "c28150b04d333d34ed9d2b77abd9f2f54e1a878a",
);
const cardSet = await figma.importComponentSetByKeyAsync(
  "a5bde480886231526d7dd890df3779dc15b52423",
);
const space = await figma.variables.importVariableByKeyAsync(
  "16bc6f84b6e7e20e4234ef79030ee580ec0f4505",
);
const bodyStyle = await figma.importStyleByKeyAsync(
  "dd16ffab542d022b9a2d78275ed222c2cb4646b4",
);
const shadowStyle = await figma.importStyleByKeyAsync(
  "6dc22e0ddb735b3b4fdf3afecd5762a1c9bc42ed",
);
function record(n) {
  created.push(n.id);
  return n;
}
function paint(n, key) {
  n.fills = [
    figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: rgb(palette[key]) },
      "color",
      variables[key],
    ),
  ];
}
function box(
  parent,
  name,
  w,
  pad = 0,
  color = "surface",
  direction = "VERTICAL",
) {
  const n = record(
    figma.createAutoLayout(direction, {
      name,
      itemSpacing: 10,
      paddingTop: pad,
      paddingBottom: pad,
      paddingLeft: pad,
      paddingRight: pad,
    }),
  );
  if (parent) parent.appendChild(n);
  n.resize(w, 44);
  n.primaryAxisSizingMode = "AUTO";
  n.counterAxisSizingMode = "FIXED";
  paint(n, color);
  return n;
}
function text(parent, value, size = 13, weight = "Regular", color = "ink") {
  const n = record(figma.createText());
  parent.appendChild(n);
  n.fontName = { family: "Inter", style: weight };
  n.fontSize = size;
  n.lineHeight = { unit: "PERCENT", value: 140 };
  n.textAutoResize = "HEIGHT";
  n.resize(parent.width - parent.paddingLeft - parent.paddingRight, 20);
  n.characters = value;
  paint(n, color);
  return n;
}
function button(parent, label, w, primary = true) {
  const base =
    buttonSet.children.find(
      (n) =>
        n.name ===
        `Variant=${primary ? "Primary" : "Neutral"}, State=Default, Size=Medium`,
    ) || buttonSet.defaultVariant;
  const n = record(base.createInstance());
  parent.appendChild(n);
  n.setProperties({
    "Label#2:0": label,
    "Has Icon Start#4:128": false,
    "Has Icon End#4:64": false,
  });
  n.resize(w, 44);
  n.cornerRadius = 10;
  paint(n, primary ? "accent" : "surface");
  created.push(...n.findAll(() => true).map((n) => n.id));
  return n;
}
function photo(parent, name, w, h) {
  const n = record(figma.createFrame());
  parent.appendChild(n);
  n.name = name;
  n.resize(w, h);
  n.cornerRadius = 14;
  paint(n, "canvas");
  slots.push({ id: n.id, name });
  return n;
}
function line(parent, value, size = 12, color = "muted") {
  return text(parent, value, size, "Regular", color);
}
const existing = page.children.reduce(
  (max, n) => Math.max(max, n.x + n.width),
  0,
);
for (const [index, name] of [
  "Agent profile",
  "Find an agent",
  "Listing detail",
].entries()) {
  const root = box(null, name + " / 390px", 390, 16);
  root.x = Math.max(100, existing + 100) + index * 470;
  root.y = 120;
  root.cornerRadius = 24;
  root.clipsContent = true;
  root.setBoundVariable("itemSpacing", space);
  roots.push({ id: root.id, name });
  text(
    root,
    "CentoMeter                                     Share",
    13,
    "Semi Bold",
  );
  if (index === 0) {
    line(root, "Demo: location gating is simulated", 10);
    const h = box(root, "Agent identity and trust", 358, 16);
    h.cornerRadius = 18;
    h.strokes = [{ type: "SOLID", color: rgb(palette.border) }];
    text(h, "AR    Ananya Rao", 24, "Bold");
    line(h, "Bengaluru · English, Kannada", 11);
    line(h, "● Usually replies in ~15 min", 11);
    const stats = box(h, "Track record", 326, 12, "canvas");
    stats.cornerRadius = 10;
    text(stats, "3 listings     12 closed deals     2 years", 13, "Semi Bold");
    line(h, "About this agent", 11);
    button(h, "Message on WhatsApp", 326);
    line(h, "Instagram             Share             Follow", 12);
    text(root, "Listings                             About", 14, "Semi Bold");
    line(root, "Buy       Rent       All types       Newest", 12, "ink");
    line(root, "Under 50 L          50 L–1 Cr          Filters", 11);
    text(root, "3 properties", 12, "Medium", "muted");
    const c = box(root, "Property / Garden City Palm Residences", 358, 0);
    c.cornerRadius = 18;
    c.strokes = [{ type: "SOLID", color: rgb(palette.border) }];
    photo(c, "Property photograph", 358, 210);
    const info = box(c, "Listing information", 358, 16);
    text(info, "₹1.28 Cr", 25, "Bold");
    text(info, "Garden City Palm Residences", 14, "Semi Bold");
    line(info, "3 BHK · 1,680 sq ft · Ready to move", 11);
    line(info, "Indiranagar, Bengaluru", 11);
    line(info, "Available       Recently confirmed", 10);
    line(info, "Location on request", 11, "accent");
  }
  if (index === 1) {
    text(root, "PEOPLE WHO KNOW YOUR PLACE", 10, "Semi Bold", "accent");
    text(root, "Find your local expert", 32, "Bold");
    line(root, "Local knowledge. A more confident next move.", 13);
    const i = record(
      inputSet.children
        .find((n) => n.name === "State=Default, Value Type=Placeholder")
        .createInstance(),
    );
    root.appendChild(i);
    i.setProperties({
      "Has Label#57:0": false,
      "Value#630:14": "Name, locality or language",
    });
    i.resize(358, 50);
    created.push(...i.findAll(() => true).map((n) => n.id));
    button(root, "Recommended     ·     More filters", 358, false);
    line(root, "Bengaluru          Hyderabad          Pune", 12, "ink");
    line(root, "New agents       Fastest to reply       Near me", 11);
    line(root, "Uses geolocation, with your city as a fallback.", 10);
    text(root, "8 local experts", 12, "Medium", "muted");
    for (const [j, person] of ["Ananya Rao", "Rahul Reddy"].entries()) {
      const c = box(root, "Agent / " + person, 358, 18);
      c.cornerRadius = 18;
      c.strokes = [{ type: "SOLID", color: rgb(palette.border) }];
      text(c, person + "  ·  Verified", 19, "Bold");
      line(c, j ? "Hyderabad · @rahul.reddy" : "Bengaluru · @ananya.rao", 11);
      line(c, "● Usually replies in ~15 min", 11);
      line(c, "Apartments      Rentals", 11);
      line(c, "3 active listings · 2 years", 11);
      photo(c, "Agent listing photograph " + j, 322, 90);
      button(c, "View profile", 322);
    }
  }
  if (index === 2) {
    line(root, "                                   ━", 16);
    text(root, "Garden City Palm Residences", 20, "Semi Bold");
    photo(root, "Detail photograph", 358, 235);
    line(root, "1 / 3     ·     View photos", 11);
    text(root, "₹1.28 Cr", 29, "Bold");
    line(root, "₹7,619 / sq ft · Indiranagar", 12);
    const emi = box(root, "EMI estimate and assumptions", 358, 12, "canvas");
    emi.cornerRadius = 10;
    text(emi, "EMI from ₹92k/mo", 13, "Semi Bold");
    line(emi, "20% down · 9% interest · 20 years", 10);
    text(root, "Key facts", 16, "Semi Bold");
    const facts = box(root, "Key facts grid", 358, 14, "canvas");
    facts.cornerRadius = 14;
    text(
      facts,
      "Apartment                  3 bedrooms\n1,680 sq ft                 Ready to move",
      13,
      "Medium",
    );
    const base =
      cardSet.children.find(
        (n) => n.name === "Asset Type=Icon, Variant=Stroke, Direction=Vertical",
      ) || cardSet.defaultVariant;
    const lock = record(base.createInstance());
    root.appendChild(lock);
    const props = lock.componentProperties;
    const override = {
      "Heading#280:0": "Location on request",
      "Body#280:13":
        "The neighbourhood is public. The exact location is shared only after agent approval.",
    };
    for (const key of ["Asset#113:13", "Body2#6062:54", "Button#113:15"])
      if (props[key]?.type === "BOOLEAN") override[key] = false;
    lock.setProperties(override);
    lock.resize(358, 150);
    paint(lock, "soft");
    lock.cornerRadius = 14;
    created.push(...lock.findAll(() => true).map((n) => n.id));
    button(root, "Request location", 358);
    line(
      root,
      "WhatsApp          Site visit          Save          Share",
      11,
      "ink",
    );
  }
  text(
    root,
    "Map        Search        Agents        Activity        Profile",
    11,
    "Medium",
    "muted",
  );
}
return {
  createdNodeIds: created,
  roots,
  imageSlots: slots,
  collectionId: collection.id,
  variableIds: Object.values(variables).map((v) => v.id),
  importedSpacingId: space.id,
  importedTextStyleId: bodyStyle.id,
  importedEffectStyleId: shadowStyle.id,
};
