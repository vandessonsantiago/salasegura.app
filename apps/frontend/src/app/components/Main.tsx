import Hero from "./Hero";

export default function Main() {
  return (
    <main className="flex-1 overflow-y-auto p-2 sm:p-4">
      <div className="w-full max-w-full sm:max-w-md lg:max-w-5xl mx-auto flex items-center justify-center min-h-full">
        <Hero />
      </div>
    </main>
  );
}
