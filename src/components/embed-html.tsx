import { useEffect, useRef } from "react";

function resetRumbleEmbed() {
  if (typeof window === "undefined") return;

  try { delete (window as unknown as Record<string, unknown>).Rumble; } catch { /* ignore */ }
  try { delete (window as unknown as Record<string, unknown>)._Rumble; } catch { /* ignore */ }
  try { delete (window as unknown as Record<string, unknown>).__videoBibleRumbleVideoId; } catch { /* ignore */ }

  const scripts = document.querySelectorAll('script[src*="rumble.com/embedJS"]');
  scripts.forEach((script) => script.parentNode?.removeChild(script));
}

/**
 * Renders raw embed HTML (e.g. Rumble iframe OR monetized script embed)
 * and properly executes any <script> tags by recreating them.
 * dangerouslySetInnerHTML alone does NOT execute scripts.
 */
export function EmbedHtml({
  html,
  className,
  onTime,
  onDuration,
  onVideoDetected,
}: {
  html: string;
  className?: string;
  onTime?: (time: number) => void;
  onDuration?: (duration: number) => void;
  onVideoDetected?: (hasVideo: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const isRumbleEmbed = /rumble\.com\/embedJS|Rumble\("play"/i.test(html);

    if (isRumbleEmbed) resetRumbleEmbed();

    const cleanupCallbacks: Array<() => void> = [];
    const attachedVideos = new WeakSet<HTMLVideoElement>();

    const readVideoState = (video: HTMLVideoElement) => {
      const nextDuration = Number.isFinite(video.duration) ? video.duration : 0;
      const nextTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;

      if (nextDuration > 0) onDuration?.(nextDuration);
      if (nextTime >= 0) onTime?.(nextTime);
    };

    const attachVideo = (video: HTMLVideoElement) => {
      if (attachedVideos.has(video)) return;
      attachedVideos.add(video);

      const sync = () => readVideoState(video);
      const events: Array<keyof HTMLMediaElementEventMap> = [
        "loadedmetadata",
        "durationchange",
        "timeupdate",
        "seeking",
        "seeked",
        "play",
        "playing",
        "pause",
        "ended",
      ];

      for (const eventName of events) {
        video.addEventListener(eventName, sync);
      }

      cleanupCallbacks.push(() => {
        for (const eventName of events) {
          video.removeEventListener(eventName, sync);
        }
      });

      sync();
    };

    const scanForVideos = () => {
      const videos = Array.from(root.querySelectorAll("video"));
      onVideoDetected?.(videos.length > 0);
      for (const video of videos) attachVideo(video);
    };

    // Replace innerHTML, then walk and re-create <script> nodes so they execute.
    root.innerHTML = html;

    const scripts = Array.from(root.querySelectorAll("script"));
    for (const old of scripts) {
      const s = document.createElement("script");
      // Copy attributes (src, type, async, etc.)
      for (const { name, value } of Array.from(old.attributes)) {
        s.setAttribute(name, value);
      }
      if (old.textContent) s.textContent = old.textContent;
      old.parentNode?.replaceChild(s, old);
    }

    scanForVideos();

    const observer = new MutationObserver(() => {
      scanForVideos();
    });
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      for (const cleanup of cleanupCallbacks) cleanup();
      onVideoDetected?.(false);
      if (isRumbleEmbed) resetRumbleEmbed();
      if (root) root.innerHTML = "";
    };
  }, [html, onDuration, onTime, onVideoDetected]);

  return <div ref={ref} className={className} />;
}
