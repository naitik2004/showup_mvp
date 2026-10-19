/** Tell every open ShowUp page to refetch authenticated attention counts. */
export function notifyNavigationChanged() {
  window.dispatchEvent(new Event("showup:network-changed"));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("showup-navigation");
    channel.postMessage("refresh");
    channel.close();
  }
}
