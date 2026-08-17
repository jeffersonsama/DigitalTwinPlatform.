/**
 * Rendu leger du texte de reponse : **gras** et lignes commencant par "- "
 * en liste a puces. Volontairement simple (pas de vraie bibliotheque
 * Markdown) — suffisant pour rendre les reponses agreables a lire.
 *
 * Partage entre components/ai/concierge.tsx (page /ai) et
 * components/home/ai-assistant-card.tsx (widget de la page d'accueil) —
 * avant, seul le premier avait ce rendu ; le second affichait le texte brut.
 */
export function renderFormattedText(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let currentList: string[] = []

  function flushList(key: string) {
    if (currentList.length === 0) return
    elements.push(
      <ul key={key} className="list-disc space-y-1 pl-4">
        {currentList.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>,
    )
    currentList = []
  }

  function renderInline(line: string): React.ReactNode {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    )
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      currentList.push(trimmed.slice(2))
    } else {
      flushList(`list-${idx}`)
      if (trimmed.length > 0) {
        elements.push(<p key={idx}>{renderInline(trimmed)}</p>)
      }
    }
  })
  flushList('list-end')

  return <div className="flex flex-col gap-1.5">{elements}</div>
}