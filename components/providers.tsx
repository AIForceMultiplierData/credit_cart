"use client"

import { AuthProvider } from "@/components/auth-provider"
import { CardLeadProvider } from "@/components/card-lead-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CardLeadProvider>{children}</CardLeadProvider>
    </AuthProvider>
  )
}
