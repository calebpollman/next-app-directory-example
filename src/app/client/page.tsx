"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { Alert, Authenticator } from "@aws-amplify/ui-react";

import { useAuth } from "../AuthContext";

export default function Client() {
  const router = useRouter();

  const { getIsAuthenticated, error, user } = useAuth();

  // initialize initial state as "undefined" as authentication status is undetermined
  const [isAuthenticated, setIsAuthenticated] = React.useState<
    boolean | undefined
  >();

  React.useEffect(() => {
    // if `user` is truthy, User is authenticated, route User to authenticated content
    if (user) {
      router.push("authenticated");
      return;
    }

    // if `user` is false on initial render, check authentication status
    getIsAuthenticated({
      // If User is authenticated, route User to authenticated content
      onAuthenticated: () => {
        router.push("authenticated");
      },
      // If User is not authenticated, set `isAuthenticated` to `false`
      onUnauthenticated: () => {
        setIsAuthenticated(false);
      },
    });

    // the below dependency array ensures the effect only runs when `user` updates.
    // `getIsAuthenticated`, `router`, `setIsAuthenticated` all maintain stable references
  }, [getIsAuthenticated, router, setIsAuthenticated, user]);

  // whether the user is authenticated has not been determined, render null
  if (isAuthenticated === undefined) {
    return null;
  }

  if (error) {
    return <Alert>{error.message}</Alert>;
  }

  // user is not authenticated, render Authenticator
  return <Authenticator />;
}
