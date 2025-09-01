"use client";

import { useEffect } from "react";
import { initClientLogging } from "./silenceLogs.client";

export default function ClientInit() {
  useEffect(() => {
    initClientLogging();
  }, []);
  return null;
}
