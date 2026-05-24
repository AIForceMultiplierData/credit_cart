"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

type ProfileEditModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName?: string
  onSaved?: () => void
}

export function ProfileEditModal({
  open,
  onOpenChange,
  initialName = "",
  onSaved,
}: ProfileEditModalProps) {
  const { user } = useAuth()
  const [fullName, setFullName] = useState(initialName)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setFullName(initialName)
    }
  }, [open, initialName])

  async function handleSave() {
    if (!user) return

    const trimmed = fullName.trim()
    if (!trimmed) {
      toast.error("Name required", {
        description: "Enter how you want to appear in your circle.",
      })
      return
    }

    setSaving(true)

    try {
      const { error: rpcError } = await supabase.rpc("update_my_profile", {
        p_full_name: trimmed,
      })

      if (rpcError) {
        const { error: upsertError } = await supabase.from("profiles").upsert(
          { id: user.id, full_name: trimmed },
          { onConflict: "id" }
        )

        if (upsertError) {
          throw upsertError
        }
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      })

      if (authError) {
        throw authError
      }

      toast.success("Profile updated", {
        description: `You're now shown as ${trimmed}.`,
      })
      onSaved?.()
      onOpenChange(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save your profile."
      toast.error("Save failed", { description: message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-800 bg-slate-900 text-slate-50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription className="text-slate-400">
            This name appears in the header and when you ping your circle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="profile-full-name" className="text-slate-300">
              Display name
            </Label>
            <Input
              id="profile-full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="e.g. Hunny"
              className="border-slate-700 bg-slate-950 text-slate-50"
              maxLength={80}
            />
          </div>
          {user?.email ? (
            <p className="text-xs text-slate-500">
              Signed in as <span className="text-slate-400">{user.email}</span>
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="w-full bg-emerald-400 font-bold text-slate-900 hover:bg-emerald-300"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save profile"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
