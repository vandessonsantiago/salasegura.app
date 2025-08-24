"use client"

import { Suspense } from "react";
import Loading from "./loading";
import Header from "./components/Header";
import Main from "./components/Main";
import Footer from "./components/Footer";

export default function Web() {

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Suspense fallback={ <Loading /> }>
          <Header />
          <Main />
          <Footer />  
      </Suspense>
    </div>
  );
}
