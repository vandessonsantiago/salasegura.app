import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ChatSessionsProvider } from "../contexts/ChatSessionsContext";
import { ChecklistProvider } from "../contexts/ChecklistContext";
import { AgendamentosProvider } from "../contexts/AgendamentosContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Sala Segura",
  description: "Plataforma administrativa da Sala Segura",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={instrumentSans.variable}>
      <body>
        <AuthProvider>
          <ChatSessionsProvider>
            <ChecklistProvider>
              <AgendamentosProvider>
                {children}
                <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                  style={{ zIndex: 9999 }}
                />
              </AgendamentosProvider>
            </ChecklistProvider>
          </ChatSessionsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


