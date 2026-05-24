import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              PoolPay Admin
            </p>
            <h1 className="text-lg font-bold text-slate-50">Operations Dashboard</h1>
          </div>
          <Link
            href="/"
            className="text-sm text-slate-400 transition-colors hover:text-slate-200"
          >
            Back to App
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}
