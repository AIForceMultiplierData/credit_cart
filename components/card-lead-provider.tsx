"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { CreditCardLeadModal } from "@/components/credit-card-lead-modal"
import type { CardLeadFormContext } from "@/lib/credit-card-lead"

type CardLeadContextValue = {
  openLeadForm: (context?: CardLeadFormContext) => void
}

const CardLeadContext = createContext<CardLeadContextValue | null>(null)

export function CardLeadProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [formContext, setFormContext] = useState<CardLeadFormContext | null>(
    null
  )

  const openLeadForm = useCallback((context?: CardLeadFormContext) => {
    setFormContext(context ?? null)
    setOpen(true)
  }, [])

  const value = useMemo(() => ({ openLeadForm }), [openLeadForm])

  return (
    <CardLeadContext.Provider value={value}>
      {children}
      <CreditCardLeadModal
        open={open}
        onOpenChange={setOpen}
        cardContext={formContext}
      />
    </CardLeadContext.Provider>
  )
}

export function useCardLead() {
  const context = useContext(CardLeadContext)
  if (!context) {
    throw new Error("useCardLead must be used within CardLeadProvider")
  }
  return context
}
