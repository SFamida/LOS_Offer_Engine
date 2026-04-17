export interface Offer {
  id: string;
  name: string;
  description: string;
  isPromo: boolean;
  status: "Active" | "Inactive";
  createdAt: string;
}
