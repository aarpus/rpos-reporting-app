export type AdminUser = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  assignedStoreCount: number;
  createdAt: string;
};

export type UserAccessStore = {
  storeCode: string;
  name: string;
  active: boolean;
  assigned: boolean;
};
