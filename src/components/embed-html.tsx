import { useEffect, useRef } from "react";

/**
 * Renders raw embed HTML (e.g. Rumble iframe OR monetized script embed)
 * and properly executes any <script> tags by recreating them.
 * dangerouslySetInnerHTML alone does NOT execute scripts.
 */
export function EmbedHtml({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

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

    return () => {
      if (root) root.innerHTML = "";
    };
  }, [html]);

  return <div ref={ref} className={className} />;
}
