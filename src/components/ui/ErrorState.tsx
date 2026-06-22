'use client'

export default function ErrorState({
  message = 'Terjadi kesalahan saat memuat data',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="text-4xl mb-4">:(</div>
      <p className="text-text-secondary text-lg mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
        >
          Coba Lagi
        </button>
      )}
    </div>
  )
}
