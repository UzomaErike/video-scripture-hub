import { useEffect, useRef, useId } from "react";

declare global {
  interface Window {
    Rumble?: (cmd: string, opts: Record<string, unknown>) => void;
  }
}

const RUMBLE_BOOTSTRAP = `!function(r,u,m,b,l,e){r._Rumble=b,r[b]||(r[b]=function(){(r[b]._=r[b]._||[]).push(arguments);if(r[b]._.length==1){l=u.createElement(m),e=u.getElementsByTagName(m)[0],l.async=1,l.src="https://rumble.com/embedJS/u4perti"+(arguments[1].video?'.'+arguments[1].video:'')+"/?url="+encodeURIComponent(location.href)+"&args="+encodeURIComponent(JSON.stringify([].slice.apply(arguments))),e.parentNode.insertBefore(l,e)}})}(window, document, "script", "Rumble");`;

function resetRumble() {
  if (typeof window === "undefined") return;
  try { delete (window as unknown as Record<string, unknown>).Rumble; } catch { /* ignore */ }
  try { delete (window as unknown as Record<string, unknown>)._Rumble; } catch { /* ignore */ }
  // Remove previously injected Rumble embedJS scripts (each is baked to a
  // single videoId) so the next bootstrap can load a fresh per-video script.
  const scripts = document.querySelectorAll('script[src*="rumble.com/embedJS"]');
  scripts.forEach((s) => s.parentNode?.removeChild(s));
}

function bootstrapRumble() {
  if (typeof window === "undefined") return;
  const s = document.createElement("script");
  s.text = RUMBLE_BOOTSTRAP;
  document.head.appendChild(s);
}

export function RumblePlayer({
  videoId,
  onTime,
  onDuration,
  className,
}: {
  videoId: string;
  onTime?: (t: number) => void;
  onDuration?: (d: number) => void;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const divId = `rumble_${videoId}_${uid}`;
  const intervalRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Each Rumble embedJS bundle is hardcoded to a single videoId. Reset and
    // re-bootstrap on every videoId change so navigating between chapters
    // doesn't trigger "Unable to load video <id>".
    resetRumble();
    bootstrapRumble();
    if (!window.Rumble) return;

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
      const root = rootRef.current;
      if (!root) return;
      const videos = Array.from(root.querySelectorAll("video"));
      for (const video of videos) attachVideo(video);
    };

    const observer = new MutationObserver(() => {
      scanForVideos();
    });

    if (rootRef.current) {
      observer.observe(rootRef.current, { childList: true, subtree: true });
    }

    window.Rumble("play", {
      video: videoId,
      div: divId,
      api: (player: {
        getCurrentTime?: () => number;
        getDuration?: () => number;
        on?: (event: string, cb: (...args: unknown[]) => void) => void;
      }) => {
        const readDuration = () => {
          try {
            const d = player.getDuration?.();
            if (typeof d === "number" && d > 0) onDuration?.(d);
          } catch { /* ignore */ }
        };
        const readTime = () => {
          try {
            const t = player.getCurrentTime?.();
            if (typeof t === "number" && !Number.isNaN(t)) onTime?.(t);
          } catch { /* ignore */ }
        };

        // Subscribe to Rumble events when available.
        try {
          player.on?.("playing", () => { readDuration(); readTime(); });
          player.on?.("play", () => { readDuration(); readTime(); });
          player.on?.("time", (...args: unknown[]) => {
            const arg = args[0] as { currentTime?: number } | number | undefined;
            if (typeof arg === "number") onTime?.(arg);
            else if (arg && typeof (arg as { currentTime?: number }).currentTime === "number") {
              onTime?.((arg as { currentTime: number }).currentTime);
            } else readTime();
            readDuration();
          });
          player.on?.("finish", () => {
            const d = player.getDuration?.();
            if (typeof d === "number" && d > 0) { onDuration?.(d); onTime?.(d); }
          });
          player.on?.("end", () => {
            const d = player.getDuration?.();
            if (typeof d === "number" && d > 0) { onDuration?.(d); onTime?.(d); }
          });
        } catch { /* ignore */ }

        // Fallback polling as a safety net.
        readDuration();
        readTime();
        scanForVideos();
        intervalRef.current = window.setInterval(() => {
          readDuration();
          readTime();
          scanForVideos();
        }, 500);
      },
    });

    return () => {
      observer.disconnect();
      for (const cleanup of cleanupCallbacks) cleanup();
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return <div id={divId} ref={rootRef} className={className} />;
}
