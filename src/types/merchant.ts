export interface Merchant {
  id: string;
  name: string;
  minLoanAmount: number;
  maxLoanAmount: number;
  vantageMin: number;
  vantageMax: number;
  minTerm: number;
  maxTerm: number;
  offers: ("Same As Cash" | "Zero Interest")[];
  excelFileName?: string;
  status: "Active" | "Inactive";
  createdAt: string;
}
