"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Amplify, Logger } from "aws-amplify";
import { Alert, Authenticator } from "@aws-amplify/ui-react";

import config from "./aws-exports";

Logger.LOG_LEVEL = "DEBUG";
Amplify.configure(config);

import * as React from "react";

import { Hub, HubCallback } from "@aws-amplify/core";
import { AmplifyUser } from "@aws-amplify/ui";
import { Auth } from "aws-amplify";

export interface UseAuth {
  user: AmplifyUser | undefined;
  getIsAuthenticated: () => Promise<boolean>;
  error: Error | undefined;
}

/**
 * Amplify Auth React hook
 * @internal
 */
export const useAuth = (): UseAuth => {
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

  const getIsAuthenticated = React.useCallback(async () => {
    try {
      console.log("trying");

      await Auth.currentAuthenticatedUser();
      console.log("succeeding");

      return true;
    } catch (e) {
      console.log("failing");

      return false;
    }
  }, []);

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

  return {
    ...result,
    getIsAuthenticated,
  };
};

export default function SignIn() {
  const router = useRouter();

  const { getIsAuthenticated, error, user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = React.useState<
    boolean | undefined
  >();

  React.useEffect(() => {
    getIsAuthenticated().then(setIsAuthenticated);
  }, [getIsAuthenticated, setIsAuthenticated]);

  React.useEffect(() => {
    if (typeof isAuthenticated === "boolean" && isAuthenticated) {
      router.push("authenticated");
    }
  }, [isAuthenticated, router]);

  // whether the user is authenticated has not been determined, render null
  if (isAuthenticated === undefined) {
    return null;
  }

  if (error) {
    console.log("HUh");

    return <Alert>{error.message}</Alert>;
  }

  // user is not authenticated, render Authenticator
  return <Authenticator />;
}
