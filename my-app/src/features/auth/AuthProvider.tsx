import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { User } from "@/types";
import { getStoredToken, storeToken, clearToken } from "@/lib/storage";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [authLoading, setAuthLoading] = useState(true);

  const getCurrentUser = useQuery(
    api.users.getCurrentUser,
    token ? { token } : "skip",
  );
  const signInMutation = useMutation(api.auth.signIn);
  const signUpMutation = useMutation(api.auth.signUp);
  const signOutMutation = useMutation(api.auth.signOut);

  useEffect(() => {
    if (token && getCurrentUser === undefined) return;
    setAuthLoading(false);
  }, [token, getCurrentUser]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await signInMutation({ email, password });
      storeToken(result.token);
      setToken(result.token);
    },
    [signInMutation],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const result = await signUpMutation({ email, password, name });
      storeToken(result.token);
      setToken(result.token);
    },
    [signUpMutation],
  );

  const signOut = useCallback(() => {
    if (token) {
      signOutMutation({ token });
    }
    clearToken();
    setToken(null);
  }, [token, signOutMutation]);

  const user = token && getCurrentUser && !Array.isArray(getCurrentUser) ? getCurrentUser as unknown as User : null;
  const isLoading = authLoading || (token !== null && getCurrentUser === undefined);
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isAuthenticated, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
