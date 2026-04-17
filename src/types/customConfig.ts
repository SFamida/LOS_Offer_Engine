export const VANTAGE_TIERS = [
  { key: "reserve",    label: "Reserve (A++)",    grade: "A++", defaultMin: 800, defaultMax: 850 },
  { key: "superPrime", label: "Super Prime (A+)", grade: "A+",  defaultMin: 760, defaultMax: 799 },
  { key: "primePlus",  label: "Prime Plus (A)",   grade: "A",   defaultMin: 730, defaultMax: 759 },
  { key: "prime",      label: "Prime (B)",         grade: "B",   defaultMin: 700, defaultMax: 729 },
  { key: "nearPrime",  label: "Near Prime (C)",   grade: "C",   defaultMin: 680, defaultMax: 699 },
  { key: "subPrime",   label: "Sub-Prime (D)",    grade: "D",   defaultMin: 640, defaultMax: 679 },
] as const;

export type VantageTierKey = typeof VANTAGE_TIERS[number]["key"];

export const APR_OPTIONS = [
  "8.99%", "9.99%", "10.99%", "11.99%", "12.99%",
  "13.99%", "14.99%", "15.99%", "16.99%", "17.99%",
] as const;

export type AprValue = typeof APR_OPTIONS[number];

export interface VantageTierEntry {
  minScore: number;
  maxScore: number;
  apr: AprValue;
  buydowns: BuydownValue[];
}

/** Keyed by VantageTierKey. Only tiers with a configured APR are included. */
export type VantageConfigMap = Partial<Record<VantageTierKey, VantageTierEntry>>;

export interface AmountBracket {
  minAmount: number;
  maxAmount: number;
  terms: number[];
}

export const BUYDOWN_OPTIONS = [1, 2, 3, 4] as const;
export type BuydownValue = typeof BUYDOWN_OPTIONS[number];

export interface CustomConfig {
  id: string;
  vantageConfig: VantageConfigMap;
  brackets: AmountBracket[];
  selectedOfferIds: string[];
  status: "Active" | "Inactive";
  createdAt: string;
}
