// Demo auth using localStorage (replace with Supabase Auth in production)
import { User } from "@/types/auth";

const USERS_KEY = "demo_users";
const SESSION_KEY = "demo_session";

type StoredUser = User & { password: string };

function getUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function signUp(email: string, password: string): { user: User | null; error: string | null } {
  const users = getUsers();
  if (users.find((u) => u.email === email)) {
    return { user: null, error: "このメールアドレスは既に登録されています" };
  }
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    email,
    password,
  };
  saveUsers([...users, newUser]);
  const session: User = { id: newUser.id, email: newUser.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { user: session, error: null };
}

export function signIn(email: string, password: string): { user: User | null; error: string | null } {
  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return { user: null, error: "メールアドレスまたはパスワードが正しくありません" };
  }
  const session: User = { id: user.id, email: user.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { user: session, error: null };
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): User | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}
