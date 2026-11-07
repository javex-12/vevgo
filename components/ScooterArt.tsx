export function ScooterArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 240"
      role="img"
      aria-label="Delivery scooter"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* motion lines */}
      <g opacity="0.45" strokeWidth="7">
        <path d="M4 116h34" />
        <path d="M0 146h24" />
        <path d="M12 176h30" />
      </g>

      {/* wheels */}
      <circle cx="74" cy="186" r="27" />
      <circle cx="246" cy="186" r="27" />
      <circle cx="74" cy="186" r="6" fill="currentColor" stroke="none" />
      <circle cx="246" cy="186" r="6" fill="currentColor" stroke="none" />

      {/* deck and frame */}
      <path d="M74 186h74a18 18 0 0 0 17-12l14-38" />
      <path d="M101 186v-24h52" />
      <path d="M153 162l22-6" />

      {/* seat + body */}
      <path d="M120 128h44a12 12 0 0 1 12 12v10" />
      <path d="M176 150c18 0 30-10 34-26" />

      {/* delivery box */}
      <rect x="86" y="52" width="86" height="72" rx="18" />
      <path d="M112 88l12 13 26-27" strokeWidth="8" />

      {/* front fork + handlebar */}
      <path d="M246 186l-10-52a16 16 0 0 1 7-17l22-12" />
      <path d="M243 86l32-12" />
      <path d="M212 70l24-9" strokeWidth="7" opacity="0.8" />

      {/* headlight */}
      <circle cx="270" cy="120" r="12" fill="currentColor" stroke="none" opacity="0.9" />
    </svg>
  );
}
