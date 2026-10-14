export type AdminStore = {
  storeCode: string;
  name: string;
  timezone: string;
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

