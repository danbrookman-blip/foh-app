/**
 * Airship Lookout wordmark — small inline SVG of the airship silhouette plus the
 * product name. Sized for both compact header and full marketing hero.
 */
export function Wordmark({ size = "sm" }: { size?: "sm" | "lg" }) {
  const dims = size === "lg" ? { svg: 36, gap: "gap-2.5", title: "text-xl", sub: "text-sm" } : { svg: 24, gap: "gap-2", title: "text-base", sub: "text-[11px]" };
  return (
    <div className={`inline-flex items-center ${dims.gap}`}>
      <AirshipMark size={dims.svg} />
      <div className="leading-tight">
        <div className={`wordmark text-navy-900 ${dims.title}`}>
          Airship <span className="text-pink-500">Lookout</span>
        </div>
      </div>
    </div>
  );
}

function AirshipMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="48" height="48" rx="12" fill="#0F1543" />
      <ellipse cx="24" cy="22" rx="15" ry="6.5" fill="#FFFFFF" />
      <rect x="21.5" y="29" width="5" height="1.5" rx="0.75" fill="#FFFFFF" />
      <rect x="23" y="30.5" width="2" height="4" rx="0.75" fill="#FFFFFF" />
      <circle cx="24" cy="22" r="2" fill="#E5277B" />
    </svg>
  );
}
