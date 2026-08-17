'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { updateProfile } from '@/lib/actions/profile'
import { AVATAR_IDS, avatarSrc } from '@/lib/avatar'
import { cn } from '@/lib/utils'

export function EditProfileModal({
  name,
  role,
  country,
  avatar,
  countries,
  onClose,
}: {
  name: string
  role: string
  country: string
  avatar: string
  countries: { name: string; flag: string }[]
  onClose: () => void
}) {
  const [nameValue, setNameValue] = useState(name)
  const [roleValue, setRoleValue] = useState(role)
  const [countryValue, setCountryValue] = useState(country)
  const [avatarValue, setAvatarValue] = useState(avatar)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function save(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await updateProfile({ name: nameValue, role: roleValue, country: countryValue, avatar: avatarValue })
      if (res.error) setError(res.error)
      else onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Edit profile</p>
          <button type="button" aria-label="Close" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avatar</p>
          <div className="scrollbar-thin grid max-h-48 grid-cols-6 gap-2 overflow-y-auto sm:grid-cols-8">
            {AVATAR_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setAvatarValue(id)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center overflow-hidden rounded-full transition-colors',
                  avatarValue === id ? 'ring-2 ring-icesco-blue ring-offset-2 ring-offset-card' : 'hover:opacity-80',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarSrc(id)} alt="" className="h-full w-full" />
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Name</span>
          <input
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-icesco-blue"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Role</span>
          <input
            value={roleValue}
            onChange={(e) => setRoleValue(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-icesco-blue"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Country</span>
          <select
            value={countryValue}
            onChange={(e) => setCountryValue(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-icesco-blue"
          >
            {countries.map((c) => (
              <option key={c.name} value={c.name}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-icesco-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-icesco disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
