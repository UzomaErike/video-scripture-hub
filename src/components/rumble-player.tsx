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
      api: (player: { getCurrentTime?: () => number; getDuration?: () => number }) => {
        const tick = () => {
          try {
            const t = player.getCurrentTime?.();
            if (typeof t === "number" && !Number.isNaN(t)) onTime?.(t);
            const d = player.getDuration?.();
            if (typeof d === "number" && d > 0) onDuration?.(d);
          } catch {
            /* ignore */
          }
        };
        tick();
        intervalRef.current = window.setInterval(tick, 250);
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
