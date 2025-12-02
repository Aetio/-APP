export enum MoonPhaseName {
  NEW_MOON = "新月",
  WAXING_CRESCENT = "蛾眉月",
  FIRST_QUARTER = "上弦月",
  WAXING_GIBBOUS = "盈凸月",
  FULL_MOON = "满月",
  WANING_GIBBOUS = "亏凸月",
  LAST_QUARTER = "下弦月",
  WANING_CRESCENT = "残月"
}

export interface MoonData {
  phase: number; // 0.0 to 1.0
  age: number; // days since new moon
  fraction: number; // illuminated fraction 0.0 to 1.0
  name: MoonPhaseName;
  rise: Date | null;
  set: Date | null;
  transit: Date | null; // culmination
  distance: number; // km
}

export interface LocationData {
  lat: number;
  lng: number;
  name: string;
}

export interface ObservationLog {
  id: string;
  date: string; // ISO string
  location: LocationData;
  weather: string;
  notes: string;
  imageUrl?: string; // base64
  aiAnalysis?: string; // Analysis from Gemini
  moonPhaseName?: string;
}