export const DISTRICTS = ["Kolhapur", "Sangli"] as const;

export const TALUKAS_BY_DISTRICT = {
  Kolhapur: [
    "Karveer",
    "Panhala",
    "Hatkanangale",
    "Shirol",
    "Kagal",
    "Gadhinglaj",
    "Chandgad",
    "Ajara",
    "Bhudargad",
    "Radhanagari",
    "Gaganbawda",
    "Shahuwadi"
  ],
  Sangli: [
    "Miraj",
    "Walwa (Islampur)",
    "Tasgaon",
    "Khanapur-Vita",
    "Kavathe Mahankal",
    "Jat",
    "Shirala",
    "Palus",
    "Atpadi",
    "Kadegaon"
  ]
} as const;

export type District = (typeof DISTRICTS)[number];

export const ALL_TALUKAS = DISTRICTS.flatMap((district) =>
  TALUKAS_BY_DISTRICT[district].map((taluka) => ({ district, taluka }))
);

export function isDistrict(value: string): value is District {
  return DISTRICTS.includes(value as District);
}

export function talukasForDistrict(district: string): string[] {
  return isDistrict(district)
    ? [...TALUKAS_BY_DISTRICT[district]]
    : ALL_TALUKAS.map((item) => item.taluka);
}
