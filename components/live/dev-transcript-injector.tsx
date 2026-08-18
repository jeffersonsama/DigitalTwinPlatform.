'use client'

import { useState } from 'react'

export function DevTranscriptInjector({ sessionId }: { sessionId: string }) {
  const [text, setText] = useState(
    "Nous parlons aujourd'hui du concept de polycrisis et de la norme ISO 53001 pour l'alignement sur les ODD.",
  )
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function inject() {
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/ai/live-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, text }),
      })
      const data = await response.json()
      setResult(response.ok ? `✅ Texte ajouté au buffer de "${sessionId}".` : `❌ Erreur : ${data.error}`)
    } catch {
      setResult('❌ Impossible de contacter le serveur — vérifie que npm run dev tourne bien.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-sm">
      <p className="mb-2 font-semibold text-amber-800">
        🧪 Outil de test — simule la reconnaissance vocale (STT non branché)
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-amber-300 p-2 text-sm text-gray-900 placeholder:text-gray-500"        placeholder="Tape ici ce qu'un orateur serait en train de dire..."
      />
      <button
        onClick={inject}
        disabled={loading}
        className="mt-2 rounded-md bg-amber-600 px-4 py-1.5 text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {loading ? 'Envoi...' : 'Ajouter ce texte au transcript'}
      </button>
      {result && <p className="mt-2 text-amber-900">{result}</p>}
    </div>
  )
}