import type { User } from "../types";

const authKey = "labourlink-auth";

export const saveSession = (user: User) => {
  localStorage.setItem(authKey, JSON.stringify(user));
};

export const loadSession = () => {
  const raw = localStorage.getItem(authKey);
  return raw ? (JSON.parse(raw) as User) : null;
};

export const clearSession = () => {
  localStorage.removeItem(authKey);
};
