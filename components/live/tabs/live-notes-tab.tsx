'use client'

import { useState } from 'react'
import { saveLiveNotes } from '@/lib/actions/live'
import { useLocale } from '@/lib/i18n'

export function LiveNotesTab({ initialNote, isLoggedIn }: { initialNote: string; isLoggedIn: boolean }) {
  const { t } = useLocale()
  const [value, setValue] = useState(initialNote)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  async function handleSave() {
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }
    setSaving(true)
    await saveLiveNotes(value)
    setSaving(false)
    setSavedAt(Date.now())
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!isLoggedIn}
        rows={5}
        placeholder={isLoggedIn ? t('live.notes.placeholderLoggedIn') : t('live.notes.placeholderLoggedOut')}
        className="w-full resize-none rounded-lg border border-white/10 bg-navy-950 p-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-cyan-accent disabled:opacity-60"
      />
      <div className="flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-cyan-accent px-4 py-1.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-cyan-accent/90 disabled:opacity-60"
        >
          {saving ? t('live.notes.saving') : t('live.notes.save')}
        </button>
        {savedAt && <span className="text-[11px] text-white/40">{t('live.notes.saved')}</span>}
      </div>
    </div>
  )
}
