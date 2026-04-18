export interface Merchant {
  id: string;
  name: string;
  customConfigId: string;
  creditUnionIds: string[];
  status: "Active" | "Inactive";
  createdAt: string;
}
