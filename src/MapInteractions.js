export const mobileQuery = '(max-width:760px), (max-width:1024px) and (pointer:coarse)';

// A map embedded in a scrolling phone page must allow a normal vertical swipe.
// The dedicated Map screen retains the full set of map gestures.
export function bindMapInteractions(map,host,media,scrollPreview,staticView=false) {
 const sync = () => {
  const scrollPage = scrollPreview && media.matches;
  for (const key of ['dragging','touchZoom','scrollWheelZoom','doubleClickZoom','boxZoom','keyboard','tapHold']) {
   const handler = map?.[key];
   if (handler) (staticView || scrollPage) ? handler.disable() : handler.enable();
  }
  if (host) host.style.touchAction = (staticView || scrollPage) ? 'pan-y pinch-zoom' : '';
 };
 sync();
 media.addEventListener?.('change',sync);
 return () => media.removeEventListener?.('change',sync);
}
