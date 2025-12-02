import React from 'react';

interface MoonVisualProps {
  phase: number; // 0 to 1
  size?: number;
}

const MoonVisual: React.FC<MoonVisualProps> = ({ phase, size = 200 }) => {
  // Use a realistic moon texture
  const MOON_TEXTURE = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/600px-FullMoon2010.jpg";

  // Phase logic for Masking:
  // We draw a white shape in a <mask>. The white part reveals the moon texture.
  // The black part (shadow) effectively hides the texture, revealing the black background.

  // Radius for SVG calculations
  const r = 48;
  const cx = 50;
  const cy = 50;

  // Calculate the "bulge" of the terminator line
  // cos(phase * 2 * PI) gives us the x-scale of the ellipse that forms the terminator
  const terminatorWidth = r * Math.cos(phase * 2 * Math.PI);
  
  // Logic to determine the SVG path for the LIT portion of the moon
  // The path must be closed and filled with white.
  
  let d = "";
  
  // 1. Waxing Crescent (0.0 - 0.25)
  // Lit part is on the Right. It is bounded by the outer circle arc and an inner ellipse arc.
  // Actually, simpler logic:
  // Waxing (0-0.5): The Right Hemisphere is the base.
  //   If < 0.25: Subtract an ellipse from the Right Hemi.
  //   If > 0.25: Add an ellipse to the Right Hemi (filling the left).
  
  // Let's build the "White Shape" (Lit Area)
  
  if (phase < 0.5) {
    // WAXING (Right side is lit)
    if (phase < 0.25) {
        // Crescent: Right Hemi minus the "dark bulge"
        // In SVG path: Move to top, Arc to bottom (Right side), then draw Ellipse arc back to top
        // But ellipse direction matters.
        // A simple way: Path = SemiCircle(Right) intersected with Ellipse? No.
        // Path = Right Semicircle ... but we mask out the inner part.
        
        // Actually, let's use the standard "two arc" approach for the phase shape.
        // Arc 1: Outer circle edge.
        // Arc 2: The terminator ellipse.
        
        // Waxing Crescent:
        // Outer Arc: From Top(50,2) to Bottom(50,98) via Right side. (sweep=1)
        // Inner Arc: From Bottom(50,98) to Top(50,2). This is the ellipse.
        // For Crescent, the ellipse curves to the RIGHT.
        d = `M 50 2 A 48 48 0 0 1 50 98 A ${Math.abs(terminatorWidth)} 48 0 0 0 50 2`;
    } else {
        // Waxing Gibbous
        // Outer Arc: From Top to Bottom via Right side.
        // Inner Arc: From Bottom to Top via Left side (bulge).
        d = `M 50 2 A 48 48 0 0 1 50 98 A ${Math.abs(terminatorWidth)} 48 0 0 1 50 2`;
    }
  } else {
    // WANING (Left side is lit)
    if (phase < 0.75) {
        // Waning Gibbous
        // Outer Arc: From Top to Bottom via Left side. (sweep=0)
        // Inner Arc: From Bottom to Top via Right side (bulge).
        d = `M 50 2 A 48 48 0 0 0 50 98 A ${Math.abs(terminatorWidth)} 48 0 0 1 50 2`;
    } else {
        // Waning Crescent
        // Outer Arc: From Top to Bottom via Left side.
        // Inner Arc: From Bottom to Top via Left side (crescent inner curve).
        d = `M 50 2 A 48 48 0 0 0 50 98 A ${Math.abs(terminatorWidth)} 48 0 0 0 50 2`;
    }
  }

  // Handle Exact New Moon (0) or Full Moon (0.5) edge cases to avoid rendering artifacts
  if (phase < 0.01 || phase > 0.99) d = ""; // No light
  if (Math.abs(phase - 0.5) < 0.01) d = "M 50 2 A 48 48 0 1 1 50 98 A 48 48 0 1 1 50 2"; // Full Circle

  return (
    <div 
      className="relative rounded-full"
      style={{ width: size, height: size, backgroundColor: '#000' }}
    >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <defs>
                {/* Define the shape of the LIT part */}
                <mask id="moonPhaseMask">
                    {/* Default black hides everything */}
                    <rect x="0" y="0" width="100" height="100" fill="black" />
                    {/* The path is White, revealing the image underneath */}
                    <path d={d} fill="white" />
                </mask>
                
                {/* Circular clip to ensure the square image is a circle */}
                <clipPath id="circleClip">
                    <circle cx="50" cy="50" r="48" />
                </clipPath>
            </defs>

            {/* Background: Just Black (Space) - Handled by container */}
            
            {/* The Real Moon Image */}
            {/* 1. We clip it to a circle so it looks like a moon orb */}
            {/* 2. We apply the mask so only the lit part shows. The rest shows the black background (shadow) */}
            <image 
                href={MOON_TEXTURE} 
                x="0" y="0" 
                width="100" height="100" 
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#circleClip)"
                mask="url(#moonPhaseMask)"
            />
            
            {/* Optional: Add a subtle inner shadow/glow to the terminator line for realism? 
                Keeping it simple for now as the texture provides good realism.
            */}
        </svg>
    </div>
  );
};

export default MoonVisual;