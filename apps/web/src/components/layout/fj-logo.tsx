/**
 * FJLogo — inline SVG, precisely matches the reference image.
 *
 * Geometry on 100×100 viewBox:
 *
 * BACKGROUND
 *   Navy squircle, rx=22
 *
 * CIRCLE RING
 *   Centre (50, 46), radius 37.
 *   Ring is ~305° of arc — gap is at bottom-right (~4:30–5:00 o'clock).
 *   Drawn as a <path> arc so start/end coords are exact.
 *   Start: just left-of-bottom (about 7 o'clock = 210° from top CW)
 *     → angle from SVG 0° = 210-90 = 120° → x=50+37cos120=50-18.5=31.5  y=46+37sin120=46+32=78
 *   End: bottom-right (about 4:30 o'clock = 135° from top CW)
 *     → angle from SVG 0° = 135-90 = 45° → x=50+37cos45=76.2  y=46+37sin45=72.2
 *   large-arc-flag=1 (arc > 180°), sweep-flag=1 (clockwise)
 *
 * CHECKMARK
 *   Sits just below the ring end-point (76.2, 72.2).
 *   Wide flat double-tick shape, similar to ✓✓ but compact.
 *   Left leg:  (66, 76) → (70, 81)
 *   Right leg: (70, 81) → (80, 69)   ← this makes a single ✓
 *   Then a second tick offset +5x:
 *   (71, 76) → (75, 81) → (85, 69)
 *   Together they form the wide double-checkmark in the reference.
 *
 * FJ TEXT
 *   White, Arial Black 900, size 33, centred at (50, 55).
 */

export function FJLogo({ size = 36, className }: { size?: number; className?: string }) {
  // Ring arc path
  // Start (7 o'clock, bottom-left of circle):
  const sx = 31.5;
  const sy = 78.0;
  // End (4:30 o'clock, bottom-right of circle):
  const ex = 76.2;
  const ey = 72.2;
  const r  = 37;

  // M sx,sy  A r,r  x-rotation  large-arc  sweep  ex,ey
  const arc = `M ${sx},${sy} A ${r},${r} 0 1 1 ${ex},${ey}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-label="Furkan J. Tracker"
      role="img"
    >
      {/* ── Navy squircle background ──────────────────────────────────── */}
      <rect width="100" height="100" rx="22" ry="22" fill="#1C3A5E" />

      {/* ── Circle ring (~305°, gap at 4:30–5:00 o'clock) ─────────────── */}
      <path
        d={arc}
        fill="none"
        stroke="#5BA3F5"
        strokeWidth="4.2"
        strokeLinecap="round"
      />

      {/* ── Double checkmark below ring endpoint ───────────────────────── */}
      {/*
          Left tick:  (66,76)→(70,82)→(80,69)
          Right tick: (71,76)→(75,82)→(85,69)
          Together they form the wide ✓✓ mark in the reference image.
      */}
      <g stroke="#5BA3F5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <polyline points="63,77 68,83 79,68" />
        <polyline points="70,77 75,83 86,68" />
      </g>

      {/* ── Bold white FJ ─────────────────────────────────────────────── */}
      <text
        x="50"
        y="56"
        textAnchor="middle"
        dominantBaseline="auto"
        fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="33"
        letterSpacing="-1"
        fill="white"
      >
        FJ
      </text>
    </svg>
  );
}
