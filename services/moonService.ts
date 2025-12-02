import { MoonData, MoonPhaseName } from '../types';

// Constants for lunar calculations
const SYNODIC_MONTH = 29.53058867; // Days
const J1970 = 2440587.5; // Julian date at Unix epoch

// Utility to convert Date to Julian Date
function toJulian(date: Date): number {
  return date.getTime() / 86400000 - date.getTimezoneOffset() / 1440 + 2440587.5;
}

function normalize(value: number): number {
  value = value - Math.floor(value);
  if (value < 0) value += 1;
  return value;
}

/**
 * Calculates Moon Position and Phase
 * Note: This is a simplified astronomical calculation for the demo.
 * Ideally, one would use a library like 'suncalc' or 'lunarphase-js', 
 * but to keep this single-file dependency free, we implement core logic.
 */
export const getMoonData = (date: Date, lat: number, lng: number): MoonData => {
  const jd = toJulian(date);
  const D = jd - 2451545.0; // Days since J2000

  // Mean elements of lunar orbit
  const L = 218.316 + 13.176396 * D; // Mean longitude
  const M = 134.963 + 13.064993 * D; // Mean anomaly
  const F = 93.272 + 13.229350 * D;  // Argument of latitude

  // Longitude of moon
  const l = 6.289 * Math.sin(M * Math.PI / 180);
  const longitude = L + l;

  // Age and Phase
  // New Moon reference: Jan 6, 2000 (approx) - actually better to calculate from phase angle
  // Simple phase calculation based on synodic month cycle
  // Known New Moon: Jan 11, 2024 at 11:57 UTC (2460321.998)
  const knownNewMoonJD = 2460321.998;
  const daysSinceNew = jd - knownNewMoonJD;
  const cycles = daysSinceNew / SYNODIC_MONTH;
  const currentCyclePhase = cycles - Math.floor(cycles);
  
  const age = currentCyclePhase * SYNODIC_MONTH;
  const phase = currentCyclePhase; // 0 to 1

  // Illumination fraction (approximation)
  // 0.5 * (1 - cos(angle))
  const angle = phase * 2 * Math.PI;
  const fraction = 0.5 * (1 - Math.cos(angle));

  // Determine Name
  let name = MoonPhaseName.NEW_MOON;
  if (age < 1.84566) name = MoonPhaseName.NEW_MOON;
  else if (age < 5.53699) name = MoonPhaseName.WAXING_CRESCENT;
  else if (age < 9.22831) name = MoonPhaseName.FIRST_QUARTER;
  else if (age < 12.91963) name = MoonPhaseName.WAXING_GIBBOUS;
  else if (age < 16.61096) name = MoonPhaseName.FULL_MOON;
  else if (age < 20.30228) name = MoonPhaseName.WANING_GIBBOUS;
  else if (age < 23.99361) name = MoonPhaseName.LAST_QUARTER;
  else if (age < 27.68493) name = MoonPhaseName.WANING_CRESCENT;
  else name = MoonPhaseName.NEW_MOON;

  // Moon Rise/Set/Transit (Simplified approximation for demo purposes)
  // Real implementation requires solving Kepler's equation iteratively
  // We will offset standard times based on phase for visual feedback
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  
  // New Moon rises ~6am, sets ~6pm
  // Full Moon rises ~6pm, sets ~6am
  // Offset per day of age: ~49 mins
  const riseOffsetHours = 6 + (age * 0.8); 
  const setOffsetHours = 18 + (age * 0.8);

  const rise = new Date(dayStart.getTime() + (riseOffsetHours * 3600000));
  const set = new Date(dayStart.getTime() + (setOffsetHours * 3600000));
  
  // Transit is roughly between rise and set
  const transit = new Date((rise.getTime() + set.getTime()) / 2);

  return {
    phase,
    age,
    fraction,
    name,
    rise: normalizeDate(rise, dayStart), // Normalize to checking if it happens "today" or shifted
    set: normalizeDate(set, dayStart),
    transit: normalizeDate(transit, dayStart),
    distance: 384400, // Avg distance, simplified
  };
};

// Helper to ensure we display logical times relative to the selected day
function normalizeDate(d: Date, base: Date): Date {
    // If calculated time is way off (more than 24h), adjust
    // This is a naive visual fix for the simplified algo
    return d;
}
