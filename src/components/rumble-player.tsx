import { useEffect, useRef, useId } from "react";

declare global {
  interface Window {
    Rumble?: (cmd: string, opts: Record<string, unknown>) => void;
  }
}

const RUMBLE_BOOTSTRAP = `!function(r,u,m,b,l,e){r._Rumble=b,r[b]||(r[b]=function(){(r[b]._=r[b]._||[]).push(arguments);if(r[b]._.length==1){l=u.createElement(m),e=u.getElementsByTagName(m)[0],l.async=1,l.src="https://rumble.com/embedJS/u4perti"+(arguments[1].video?'.'+arguments[1].video:'')+"/?url="+encodeURIComponent(location.href)+"&args="+encodeURIComponent(JSON.stringify([].slice.apply(arguments))),e.parentNode.insertBefore(l,e)}})}(window, document, "script", "Rumble");`;

let bootstrapped = false;
function ensureRumble() {
  if (bootstrapped || typeof window === "undefined") return;
  if (!window.Rumble) {
    const s = document.createElement("script");
    s.text = RUMBLE_BOOTSTRAP;
    document.head.appendChild(s);
  }
  bootstrapped = true;
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

  useEffect(() => {
    ensureRumble();
    if (!window.Rumble) return;

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
        intervalRef.current = window.setInterval(() => {
          readDuration();
          readTime();
        }, 500);
      },
    });

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return <div id={divId} className={className} />;
}
