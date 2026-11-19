/** Leave the WebView for http(s) links when Capacitor's Browser plugin is present. */
export function openExternal(event) {
  const url = event?.currentTarget?.href || "";
  if (!/^https?:/i.test(url)) return;
  const open = globalThis.Capacitor?.Plugins?.Browser?.open;
  if (typeof open !== "function") return;
  event.preventDefault();
  void open({ url });
}
