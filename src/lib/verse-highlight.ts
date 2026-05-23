const VERSE_HIGHLIGHT_KEY = "verseHighlight";
const VERSE_HIGHLIGHT_EVENT = "verseHighlightChange";

export function getVerseHighlightEnabled() {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(VERSE_HIGHLIGHT_KEY);
  return stored === null ? true : stored === "true";
}

export function setVerseHighlightEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VERSE_HIGHLIGHT_KEY, String(enabled));
  window.dispatchEvent(
    new CustomEvent(VERSE_HIGHLIGHT_EVENT, { detail: enabled }),
  );
}

export function subscribeVerseHighlight(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === VERSE_HIGHLIGHT_KEY) callback();
  };

  const onCustom = () => {
    callback();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(VERSE_HIGHLIGHT_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(VERSE_HIGHLIGHT_EVENT, onCustom);
  };
}