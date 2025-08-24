export default function Loading() {
  // Or a custom loading skeleton component
  return(
    <main className="min-h-screen flex flex-col justify-center items-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-blue-600 border-r-blue-600"></div>
          <p className="text-sm text-gray-500 mt-2">Preparando sua experiência</p>
    </main>
    )
}