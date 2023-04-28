"use client";

import React from "react";
import { defaultDarkModeOverride, ThemeProvider } from "@aws-amplify/ui-react";

const theme = {
  name: "dark-theme",
  overrides: [defaultDarkModeOverride],
};

export default function Theme({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme} colorMode="dark">
      {children}
    </ThemeProvider>
  );
}
