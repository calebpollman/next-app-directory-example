"use client";

import React from "react";

import { Hub, HubCallback } from "@aws-amplify/core";
import { AmplifyUser } from "@aws-amplify/ui";
import { Auth } from "aws-amplify";

interface GetIsAuthenticatedParams {
  onAuthenticated?: () => void;
  onUnauthenticated?: () => void;
}

export interface UseAuth {
  user: AmplifyUser | undefined;
  getIsAuthenticated: (params?: GetIsAuthenticatedParams) => Promise<boolean>;
  error: Error | undefined;
}

type AuthContextType = UseAuth;

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children?: React.ReactNode }) {
  const [result, setResult] = React.useState<
    Omit<UseAuth, "getIsAuthenticated">
  >({
    error: undefined,
    user: undefined,
  });

  /**
   * Hub events like `tokenRefresh` will not give back the user object.
   * This util will be used to get current user after those events.
   */
  const fetchCurrentUser = React.useCallback(async () => {
    try {
      // Auth.signOut();
      // casting the result because `Auth.currentAuthenticateduser` returns `any`
      const user = (await Auth.currentAuthenticatedUser()) as AmplifyUser;
      setResult({ user, error: undefined });
    } catch (e) {
      // const error = e as Error;
      // setResult({ error, user: undefined });
    }
  }, []);

  const getIsAuthenticated = React.useCallback(
    async ({
      onAuthenticated,
      onUnauthenticated,
    }: GetIsAuthenticatedParams | undefined = {}) => {
      try {
        await Auth.currentAuthenticatedUser();
        if (typeof onAuthenticated === "function") {
          onAuthenticated();
        }

        return true;
      } catch (e) {
        if (typeof onUnauthenticated === "function") {
          onUnauthenticated();
        }

        return false;
      }
    },
    []
  );

  const handleAuth: HubCallback = React.useCallback(
    ({ payload }) => {
      switch (payload.event) {
        // success events
        case "signIn":
        case "signUp":
        case "autoSignIn": {
          setResult((prev) => ({ ...prev, user: payload.data as AmplifyUser }));
          break;
        }
        case "signOut": {
          setResult((prev) => ({ ...prev, user: undefined }));
          break;
        }

        // failure events
        case "tokenRefresh_failure":
        case "signIn_failure": {
          setResult((prev) => ({ ...prev, error: payload.data as Error }));
          break;
        }
        case "autoSignIn_failure": {
          // autoSignIn just returns error message. Wrap it to an Error object
          setResult((prev) => ({ ...prev, error: new Error(payload.message) }));
          break;
        }

        // events that need another fetch
        case "tokenRefresh": {
          fetchCurrentUser();
          break;
        }

        default: {
          // we do not handle other hub events like `configured`.
          break;
        }
      }
    },
    [fetchCurrentUser]
  );

  React.useEffect(() => {
    const unsubscribe = Hub.listen("auth", handleAuth, "useAuth");
    fetchCurrentUser(); // on init, see if user is already logged in

    return unsubscribe;
  }, [handleAuth, fetchCurrentUser]);

  const value = React.useMemo(
    () => ({ ...result, getIsAuthenticated }),
    [getIsAuthenticated, result]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): UseAuth => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("No AuthContext!");
  }

  return context;
};
