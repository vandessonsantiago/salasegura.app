const enabled = process.env.NEXT_PUBLIC_ENABLE_DEBUG === "true";

export const logger = {
  log: (...args: any[]) => {
    if (enabled) console.log(...args);
  },
  info: (...args: any[]) => {
    if (enabled) console.info(...args);
  },
  debug: (...args: any[]) => {
    if (enabled) console.debug(...args);
  },
  warn: (...args: any[]) => {
    // always show warnings to help diagnose issues in production
    console.warn(...args);
  },
  error: (...args: any[]) => {
    // always show errors
    console.error(...args);
  }
};

export default logger;
