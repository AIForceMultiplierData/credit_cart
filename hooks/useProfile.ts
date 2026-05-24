"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

export type CircleMember = {
  name: string
  initial: string
}

type ProfileState = {
  fullName: string
  circleMembers: CircleMember[]
}

function parseCircleMembers(raw: unknown): CircleMember[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((item) => {
      if (typeof item !== "object" || item === null) return null
      const row = item as Record<string, unknown>
      const name =
        typeof row.name === "string"
          ? row.name.trim()
          : typeof row.email === "string"
            ? row.email.split("@")[0]
            : ""

      if (!name) return null

      return {
        name,
        initial: name[0]?.toUpperCase() ?? "?",
      }
    })
    .filter((member): member is CircleMember => member !== null)
}

function displayNameFromUser(
  fullName: string | null | undefined,
  metadata: Record<string, unknown> | undefined,
  email: string | undefined
): string {
  if (fullName?.trim()) return fullName.trim()

  const metaName =
    (typeof metadata?.full_name === "string" && metadata.full_name) ||
    (typeof metadata?.name === "string" && metadata.name) ||
    ""

  if (metaName.trim()) return metaName.trim()
  if (email) return email.split("@")[0]
  return ""
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileState | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const fallbackName = displayNameFromUser(
      null,
      user.user_metadata as Record<string, unknown>,
      user.email
    )

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, circle_members")
      .eq("id", user.id)
      .maybeSingle()

    if (error) {
      setProfile({
        fullName: fallbackName,
        circleMembers: [],
      })
      setLoading(false)
      return
    }

    const row = data as {
      full_name?: string | null
      circle_members?: unknown
    } | null

    setProfile({
      fullName: displayNameFromUser(
        row?.full_name,
        user.user_metadata as Record<string, unknown>,
        user.email
      ),
      circleMembers: parseCircleMembers(row?.circle_members),
    })
    setLoading(false)
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    profile,
    loading,
    refresh,
    circleCount: profile?.circleMembers.length ?? 0,
    circleMembers: profile?.circleMembers ?? [],
  }
}
