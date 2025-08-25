import type { Config } from "tailwindcss";
import preset from "@vandessonsantiago/config/tailwind-preset";

export default {
  presets: [preset],
  content: [
    "./app/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ]
} satisfies Config;


