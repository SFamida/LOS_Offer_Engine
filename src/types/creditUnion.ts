export interface CreditUnion {
  id: string;
  name: string;
  minLoanAmount: number;
  maxLoanAmount: number;
  vantageMin: number;
  vantageMax: number;
  minTerm: number;
  maxTerm: number;
  status: "Active" | "Inactive";
  createdAt: string;
}
