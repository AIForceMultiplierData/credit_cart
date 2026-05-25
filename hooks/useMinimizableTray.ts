"use client"

import { useCallback, useEffect, useState } from "react"

/** Collapsed by default; re-collapses when user returns to the tab. */
export function useMinimizableTray(_id?: string) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setOpen(false)
      }
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  const collapse = useCallback(() => setOpen(false), [])

  return { open, setOpen, collapse }
}
