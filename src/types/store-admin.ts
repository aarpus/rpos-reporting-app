import type { StoreType } from "@/lib/store-type";

export type AdminStore = {
  storeCode: string;
  name: string;
  timezone: string;
  storeType: StoreType;
  active: boolean;
  assignedUserCount: number;
  createdAt: string;
  updatedAt: string;
};

export type StoreAccessUser = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  assigned: boolean;
};

export type PosCredentialSummary = {
  keyId: string;
  active: boolean;
  createdAt: string;
};

export type IssuedPosCredential = {
  storeCode: string;
  keyId: string;
  secret: string;
};

