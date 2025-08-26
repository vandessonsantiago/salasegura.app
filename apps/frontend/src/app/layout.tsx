import { Instrument_Sans } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChecklistProvider } from "@/contexts/ChecklistContext";
import { AgendamentosProvider } from "@/contexts/AgendamentosContext";
import "./styles.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={instrumentSans.className}>
        <AuthProvider>
          <ChecklistProvider>
            <AgendamentosProvider>
              {children}
            </AgendamentosProvider>
          </ChecklistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
