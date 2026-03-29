export type User = {
  id: string;
  email: string;
};

export type AuthState = {
  user: User | null;
  loading: boolean;
};
