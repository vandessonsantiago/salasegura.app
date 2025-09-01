"use client";

/**
 * Initialize client-side logging policy.
 * In production this will silence most console methods to avoid leaking data
 * and noisy logs to end users. Toggle with NEXT_PUBLIC_ENABLE_DEBUG=true.
 */
export function initClientLogging() {
  if (typeof window === "undefined") return;

  const enableDebug = process.env.NEXT_PUBLIC_ENABLE_DEBUG === "true";
  const isProd = process.env.NODE_ENV === "production" && !enableDebug;

  // Add a class to the html element so CSS can hide debug UI when appropriate
  try {
    document.documentElement.classList.toggle("env-prod", isProd);
  } catch (e) {
    // ignore
  }

  if (!isProd) return;

  // Silence noisy console methods in production
  const noop = () => {};
  try {
    // Keep warn/error enabled but optionally you could route them to an error service.
    console.log = noop;
    console.info = noop;
    console.debug = noop;
    console.trace = noop;
    // Keep console.warn and console.error so critical issues are still visible in console.
  } catch (e) {
    // ignore
  }
}
