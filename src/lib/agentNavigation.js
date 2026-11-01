import { reducedMotion } from "./agentMotion";
import {
  startTransition,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";

export function sameAgentPage(before, after) {
  return (
    before.split("?")[0].startsWith("agent/") &&
    before.split("?")[0] === after.split("?")[0]
  );
}
// A listing owns one history entry. Filters/tabs only replace that entry.
export function useAgentNavigation(route) {
  const [search, setSearch] = useState(() => route.split("?")[1] || "");
  const searchRef = useRef(search);
  searchRef.current = search;
  const path = route.split("?")[0];
  useEffect(() => {
    const q = new URLSearchParams(location.hash.split("?")[1] || "");
    if (q.has("l") && !history.state?.centometerListing) {
      const original = location.href,
        state = history.state;
      q.delete("l");
      history.replaceState(state, "", "#" + path + (q.size ? "?" + q : ""));
      history.pushState({ ...state, centometerListing: true }, "", original);
    }
  }, [path]);
  useEffect(() => {
    const sync = () => setSearch(location.hash.split("?")[1] || "");
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);
  useEffect(() => setSearch(route.split("?")[1] || ""), [route]);
  const replace = useCallback(
    (query) => {
      const next = query.toString();
      history.replaceState(
        history.state,
        "",
        "#" + path + (next ? "?" + next : ""),
      );
      searchRef.current = next;
      setSearch(next);
    },
    [path],
  );
  const open = useCallback(
    (id) => {
      const q = new URLSearchParams(searchRef.current);
      if (!q.has("l"))
        history.pushState(
          { ...history.state, centometerListing: true },
          "",
          location.href,
        );
      q.set("l", id);
      if (reducedMotion()) replace(q);
      else startTransition(() => replace(q));
    },
    [replace],
  );
  const close = useCallback(() => {
    if (history.state?.centometerListing) {
      history.back();
      return;
    }
    const q = new URLSearchParams(searchRef.current);
    q.delete("l");
    replace(q);
  }, [replace]);
  useEffect(() => {
    const key = (e) => {
      if (
        e.key === "Escape" &&
        searchRef.current.includes("l=") &&
        !document.querySelector(".modal")
      )
        close();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [close]);
  return { query: new URLSearchParams(search), replace, open, close };
}
