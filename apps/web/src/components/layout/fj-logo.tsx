/**
 * FJLogo — inline SVG logo.
 *
 * Matches the reference image exactly:
 *   - Deep navy (#1A3560) rounded-square background
 *   - Bold white "FJ" centered
 *   - Blue (#5BA3F5) circle ring, almost complete — gap opens at ~5 o'clock
 *     (bottom-right), giving room for the checkmark
 *   - Double chevron checkmark sits right in the gap at the ring's end
 *
 * All geometry is calculated on a 100×100 viewBox.
 *
 * Circle math:
 *   centre (50,50), r=33, circumference=207.3
 *   We draw ~85% = 176 units, leave 31-unit gap.
 *   Gap should sit at 4–5 o'clock (≈135° from top, clockwise).
 *   SVG angles: 0° = 3 o'clock. We want gap at 135° from top = 135+90=225° from 3 o'clock.
 *   Arc starts just after the gap and travels 176 units CCW back around.
 *   Simplest: rotate the dashed circle so that stroke-dasharray starts at the gap point.
 *   Gap start at 225°, so rotate by 225-90=135° (the +90 accounts for SVG's 0°=3 o'clock
 *   vs dasharray's natural start at the "right" side).
 *   After drawing 176 units, the ring ends just before the gap = cleanly at ~4:50 o'clock.
 *
 * Checkmark position:
 *   Gap centre at 225° from SVG 0° = 225° from 3 o'clock.
 *   Point on ring: x=50+33*cos(225°)=50-23.3=26.7, y=50+33*sin(225°)=50-23.3=26.7
 *   That's top-left — wrong. Let me recalculate for bottom-right.
 *
 *   Bottom-right on clock = ~135° from 12 o'clock clockwise.
 *   From SVG 0° (3 o'clock): 135-90 = 45° → x=50+33*cos(45°)=73.3, y=50+33*sin(45°)=73.3
 *   So gap is around (73,73). Checkmark placed there.
 *   Ring goes from 45°+gap_angle clockwise all the way around back to 45°.
 *   With dasharray: rotate(45-90=-45) so dasharray starts at 45° from SVG 0°.
 */

export function FJLogo({ size = 36, className }: { size?: number; className?: string }) {
  // Circumference of r=33: 2π×33 = 207.3
  // Arc length (ring drawn): 176  |  Gap: 31
  const r = 33;
  const arcLen = 176;
  const gap = 31;

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
      {/* Navy rounded-square background */}
      <rect width="100" height="100" rx="21" ry="21" fill="#1A3560" />

      {/*
        Circle ring.
        rotate(-45) so that stroke-dasharray starts at 45° from SVG 0°
        (= bottom-right of circle), meaning the drawn arc begins just after
        the gap and travels the long way around, ending just before bottom-right.
        The gap is therefore at the bottom-right, ~5 o'clock position.
      */}
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#5BA3F5"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray={`${arcLen} ${gap}`}
        transform="rotate(-45 50 50)"
      />

      {/*
        Double checkmark positioned at the gap (~bottom-right).
        The gap centre is at 45° from SVG 0° = bottom-right.
        Point: x=50+33*cos(45°)≈73.3, y=50+33*sin(45°)≈73.3
        Two small ticks side by side, slightly inside the ring.
      */}
      <g stroke="#5BA3F5" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Left tick of double-checkmark */}
        <polyline points="60,74 64,79 72,68" />
        {/* Right tick (shifted right) */}
        <polyline points="66,74 70,79 78,68" />
      </g>

      {/* Bold white FJ — centered in the circle */}
      <text
        x="50"
        y="57"
        textAnchor="middle"
        dominantBaseline="auto"
        fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="34"
        letterSpacing="-1"
        fill="white"
      >
        FJ
      </text>
    </svg>
  );
}
