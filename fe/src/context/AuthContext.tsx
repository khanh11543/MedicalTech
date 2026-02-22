import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService, {
  type LoginRequest,
  type TokenResponse,
} from "../services/authService";
import userService from "../services/userService";

interface AuthUser {
  userId: number;
  email: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
  avatarUrl?: string | null;
  fullName?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<TokenResponse>;
  logout: () => Promise<void>;
  setAuthFromToken: (tokenData: TokenResponse) => void;
  updateUserProfile: (partial: { avatarUrl?: string | null; fullName?: string | null }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const storedUser = localStorage.getItem("user");

    if (accessToken && refreshToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          ...parsedUser,
          accessToken,
          refreshToken,
        });
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch profile (avatarUrl, fullName) once authenticated
  useEffect(() => {
    if (!user?.accessToken) return;
    userService.getProfile().then((profile) => {
      setUser((prev) =>
        prev
          ? { ...prev, avatarUrl: profile.avatarUrl, fullName: profile.fullName }
          : prev
      );
    }).catch(() => {
      // ignore — profile fetch is best-effort
    });
    // only run once when user becomes authenticated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.accessToken]);

  const updateUserProfile = useCallback(
    (partial: { avatarUrl?: string | null; fullName?: string | null }) => {
      setUser((prev) => (prev ? { ...prev, ...partial } : prev));
    },
    []
  );

  const setAuthFromToken = useCallback((tokenData: TokenResponse) => {
    const authUser: AuthUser = {
      userId: tokenData.userId,
      email: tokenData.email,
      roles: tokenData.roles,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
    };

    localStorage.setItem("accessToken", tokenData.accessToken);
    localStorage.setItem("refreshToken", tokenData.refreshToken);
    localStorage.setItem(
      "user",
      JSON.stringify({
        userId: tokenData.userId,
        email: tokenData.email,
        roles: tokenData.roles,
      })
    );

    setUser(authUser);
  }, []);

  const login = useCallback(
    async (data: LoginRequest): Promise<TokenResponse> => {
      const tokenData = await authService.login(data);
      setAuthFromToken(tokenData);
      return tokenData;
    },
    [setAuthFromToken]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setAuthFromToken,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
