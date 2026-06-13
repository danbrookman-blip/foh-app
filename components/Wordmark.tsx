/**
 * Airship Lookout wordmark — styled in the Ask Airship sub-brand visual idiom:
 * outlined airship silhouette in bright magenta on a deep purple field, with the
 * "Lookout" wordmark inside the shape. Distinct from the muted CRM dashboard
 * palette used across the rest of the app — this is the brand-loud identity mark.
 */
export function Wordmark({ size = "sm" }: { size?: "sm" | "lg" }) {
  if (size === "lg") return <WordmarkLarge />;
  return <WordmarkSmall />;
}

function WordmarkSmall() {
  return (
    <div className="inline-flex items-center gap-2">
      <AirshipMark />
      <div className="leading-none">
        <span className="wordmark text-base text-pickled-bluewood">Airship</span>
        <span className="wordmark text-base text-neon-magenta ml-1">Lookout</span>
      </div>
    </div>
  );
}

function WordmarkLarge() {
  return (
    <div className="relative inline-flex items-center justify-center px-6 py-4 rounded-xl2 bg-deep-purple shadow-pop">
      <AirshipOutlineMark />
      <span className="wordmark text-2xl text-neon-magenta tracking-widest uppercase ml-3">
        Lookout
      </span>
    </div>
  );
}

function AirshipMark() {
  // Compact header version — solid fill in the brand idiom
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="48" height="48" rx="12" fill="#3D0A4D" />
      <ellipse
        cx="24"
        cy="22"
        rx="15"
        ry="6.5"
        fill="none"
        stroke="#D824D8"
        strokeWidth="2.5"
      />
      <rect x="20.5" y="29" width="7" height="2" rx="1" fill="#D824D8" />
      <rect x="22.5" y="31" width="3" height="5" rx="1" fill="#D824D8" />
    </svg>
  );
}

function AirshipOutlineMark() {
  // Hero version — bigger outlined balloon for the marketing card
  return (
    <svg
      width={56}
      height={36}
      viewBox="0 0 72 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse
        cx="36"
        cy="22"
        rx="30"
        ry="13"
        fill="none"
        stroke="#D824D8"
        strokeWidth="3"
      />
      <rect x="29" y="36" width="14" height="3" rx="1" fill="#D824D8" />
      <rect x="34" y="39" width="4" height="6" rx="1" fill="#D824D8" />
    </svg>
  );
}
