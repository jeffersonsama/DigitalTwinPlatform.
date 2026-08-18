import { describe, it, expect } from 'vitest'
import { stripReasoningArtifacts, filterReasoningStream } from '@/lib/ai/textCleanup'

describe('stripReasoningArtifacts', () => {
  it('retire un bloc <think> complet, meme sur plusieurs lignes', () => {
    const input = '<think>Je reflechis a la reponse...\nEncore un peu...</think>Voici la vraie reponse.'
    expect(stripReasoningArtifacts(input)).toBe('Voici la vraie reponse.')
  })

  it("retire un bloc <think> jamais ferme (coupe en fin de flux streame)", () => {
    const input = 'Avant.<think>Reflexion interrompue en plein milieu'
    expect(stripReasoningArtifacts(input)).toBe('Avant.')
  })

  it('retire une tentative d\'appel d\'outil ecrite en texte brut', () => {
    const input = 'Un texte.<tool_call>function=find_sessions query=climate</tool_call>Reste du texte.'
    expect(stripReasoningArtifacts(input)).toBe('Un texte.Reste du texte.')
  })

  it("ne modifie pas un texte qui ne contient aucun artefact", () => {
    const input = "Voici une reponse normale, sans balise particuliere."
    expect(stripReasoningArtifacts(input)).toBe(input)
  })

  it('retire plusieurs artefacts combines dans le meme texte', () => {
    const input = '<think>reflexion</think>Reponse.<tool_call>appel rate</tool_call>'
    expect(stripReasoningArtifacts(input)).toBe('Reponse.')
  })
})

describe('filterReasoningStream', () => {
  async function collect(gen: AsyncGenerator<string, void, unknown>): Promise<string> {
    let out = ''
    for await (const chunk of gen) out += chunk
    return out
  }

  async function* fakeStream(chunks: string[]) {
    for (const c of chunks) yield c
  }

  it('laisse passer un flux propre sans aucun artefact', async () => {
    const result = await collect(filterReasoningStream(fakeStream(['Bon', 'jour', ' le monde'])))
    expect(result).toBe('Bonjour le monde')
  })

  it('supprime un bloc <think> complet regu en un seul morceau', async () => {
    const result = await collect(filterReasoningStream(fakeStream(['<think>secret</think>Reponse visible'])))
    expect(result).toBe('Reponse visible')
  })

  it("supprime un bloc <think> meme quand la balise est coupee entre plusieurs morceaux de flux", async () => {
    const chunks = ['Avant.', '<thi', 'nk>contenu ', 'cache</th', 'ink>Apres.']
    const result = await collect(filterReasoningStream(fakeStream(chunks)))
    expect(result).toBe('Avant.Apres.')
  })

  it('supprime un bloc <tool_call> ecrit en texte brut', async () => {
    const chunks = ['Texte.', '<tool_call>', 'appel rate', '</tool_call>', 'Suite.']
    const result = await collect(filterReasoningStream(fakeStream(chunks)))
    expect(result).toBe('Texte.Suite.')
  })

  it("ne laisse rien fuiter si le flux se termine au milieu d'un bloc supprime", async () => {
    const chunks = ['Avant.', '<think>reflexion jamais terminee']
    const result = await collect(filterReasoningStream(fakeStream(chunks)))
    expect(result).toBe('Avant.')
  })
})