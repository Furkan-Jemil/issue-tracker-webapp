/**
 * FJLogo — pixel-accurate recreation of the FJ Tracker app icon.
 *
 * Geometry (100×100 viewBox):
 *   - Navy squircle background
 *   - Large circle ring (r=38) centred at (50,48), almost complete.
 *     Ring travels ~300° clockwise from top-left, ending at ~5 o'clock
 *     (bottom-right). The gap is ~60° wide starting at ~300° from 12 o'clock.
 *   - Single checkmark (✓) whose left leg starts exactly where the ring ends
 *     and whose right leg points up-right — so the mark looks like it IS
 *     the terminal stroke of the ring curving into a tick.
 *   - Bold white "FJ" centered inside the circle.
 *
 * Circle ring endpoint calculation:
 *   Centre (50,48), r=38.
 *   Ring ends at ~300° from 12 o'clock (clockwise) = 210° in SVG angle convention
 *   (SVG 0° = 3 o'clock; 12 o'clock = -90° = 270°).
 *   300° from 12 o'clock CW = 300 - 90 = 210° in standard SVG.
 *   x = 50 + 38·cos(210°) = 50 + 38·(-0.866) = 50 - 32.9 = 17.1  ← that's left side
 *
 *   Let's use a cleaner approach: the ring visually ends at bottom-right.
 *   Bottom-right on a circle at (50,48) r=38:
 *   Angle 135° from 12 o'clock CW → SVG angle = 135-90 = 45°
 *   x = 50 + 38·cos(45°) = 50 + 26.9 = 76.9
 *   y = 48 + 38·sin(45°) = 48 + 26.9 = 74.9
 *   So ring ends near (77, 75).
 *
 *   Using stroke-dasharray on <path> arc for precise control:
 *   Draw arc from top (50,10) clockwise ending at (77,75) — that's ~300° arc.
 *   Then checkmark starts at (77,75).
 */

export function FJLogo({ size = 36, className }: { size?: number; className?: string }) {
  // Arc path: large circle centered (50,48) r=38
  // Start at top of circle: (50, 10)
  // End at bottom-right: approximately (77, 75)
  // Sweep: clockwise (sweep-flag=1), large-arc-flag=1 (>180°)
  const cx = 50;
  const cy = 48;
  const r  = 38;

  // Start point: top of circle
  const startX = cx;
  const startY = cy - r; // (50, 10)

  // End point: ~135° clockwise from 12 o'clock = 45° SVG = bottom-right
  const endAngleDeg = 45; // SVG convention (0°=right)
  const endRad = (endAngleDeg * Math.PI) / 180;
  const endX = parseFloat((cx + r * Math.cos(endRad)).toFixed(2)); // ≈ 76.87
  const endY = parseFloat((cy + r * Math.sin(endRad)).toFixed(2)); // ≈ 74.87

  // SVG arc: M startX,startY A r,r 0 large-arc sweep endX,endY
  // large-arc-flag=1 because arc > 180°
  const arcPath = `M ${startX},${startY} A ${r},${r} 0 1 1 ${endX},${endY}`;

  // Checkmark: starts at ring endpoint (endX, endY), goes down-left then up-right
  // Left leg: from (endX,endY) → slightly down-left: (-8, +7)
  const ck1x = parseFloat((endX - 8).toFixed(2));  // ≈ 68.87
  const ck1y = parseFloat((endY + 7).toFixed(2));  // ≈ 81.87
  // Right leg: from ck1 → up-right: (+12, -13)
  const ck2x = parseFloat((ck1x + 12).toFixed(2)); // ≈ 80.87
  const ck2y = parseFloat((ck1y - 13).toFixed(2)); // ≈ 68.87

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
      <rect width="100" height="100" rx="20" ry="20" fill="#1A3560" />

      {/* Circle ring — large arc ~300°, clockwise, ends at bottom-right */}
      <path
        d={arcPath}
        fill="none"
        stroke="#5BA3F5"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Checkmark — connects from ring endpoint downward then upward */}
      <polyline
        points={`${endX},${endY} ${ck1x},${ck1y} ${ck2x},${ck2y}`}
        fill="none"
        stroke="#5BA3F5"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bold white "FJ" centered inside the ring */}
      <text
        x="50"
        y="56"
        textAnchor="middle"
        dominantBaseline="auto"
        fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="32"
        letterSpacing="-1"
        fill="white"
      >
        FJ
      </text>
    </svg>
  );
}
