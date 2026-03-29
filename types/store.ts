export type Store = {
  id: string;
  user_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  memo?: string;
  created_at: string;
  updated_at: string;
};

export type StoreFormData = {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  memo?: string;
};
