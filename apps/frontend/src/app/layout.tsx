import { Instrument_Sans } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChecklistProvider } from "@/contexts/ChecklistContext";
import { AgendamentosProvider } from "@/contexts/AgendamentosContext";
import { DivorceProvider } from "@/contexts/DivorceContext";
import { ToastProvider } from "@/components/ui/ToastProvider";
import FeedbackButton from "@/components/ui/FeedbackButton";
import "./styles.css";
import ClientInit from "../lib/ClientInit";

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
              <DivorceProvider>
                <ToastProvider>
                  {/* ClientInit runs only on the client and applies production logging rules */}
                  <ClientInit />
                  {children}
                  <FeedbackButton />
                </ToastProvider>
              </DivorceProvider>
            </AgendamentosProvider>
          </ChecklistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
