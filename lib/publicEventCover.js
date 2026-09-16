"use client";

import { createContext, useContext } from "react";

export const PublicEventCoverContext = createContext(null);

export function usePublicEventCover() {
  return useContext(PublicEventCoverContext);
}
