let pending;
export function loadListingDetails() {
  return (pending ||= import("../components/agent/ListingDetailSheet").catch(
    (error) => {
      pending = undefined;
      throw error;
    },
  ));
}
export function preloadListingDetails() {
  void loadListingDetails().catch(() => {});
}
