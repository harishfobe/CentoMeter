const SCHEME = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

/** Prefix a public-folder path with Vite's base. Leaves remote, data, and blob URLs alone. */
export function publicAsset(path) {
  if (typeof path !== "string" || path.length === 0) return "";
  if (SCHEME.test(path) || path.startsWith("./") || path.startsWith("../"))
    return path;
  const base = import.meta.env.BASE_URL || "/";
  const clean = path.replace(/^\/+/, "");
  if (!clean) return base;
  if (base === "/") return "/" + clean;
  return (base.endsWith("/") ? base : base + "/") + clean;
}
