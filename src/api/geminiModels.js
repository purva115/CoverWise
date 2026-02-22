const MODELS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
const CACHE_TTL_MS = 5 * 60 * 1000

let cachedApiKey = ''
let cachedAt = 0
let cachedModels = []

function normalizeModelName(name) {
  if (!name) return ''
  return String(name).replace(/^models\//, '')
}

function rankModel(name) {
  const model = String(name || '').toLowerCase()
  if (model.includes('2.5-flash')) return 0
  if (model.includes('2.0-flash')) return 1
  if (model.includes('flash-lite')) return 2
  if (model.includes('flash')) return 3
  if (model.includes('pro')) return 4
  return 5
}

export async function listGenerateContentModels(apiKey) {
  if (!apiKey) return []

  const now = Date.now()
  if (cachedApiKey === apiKey && now - cachedAt < CACHE_TTL_MS && cachedModels.length) {
    return cachedModels
  }

  try {
    const res = await fetch(`${MODELS_ENDPOINT}?key=${apiKey}`)
    if (!res.ok) return []

    const data = await res.json()
    const models = Array.isArray(data?.models) ? data.models : []

    const available = models
      .filter((model) => {
        const methods = Array.isArray(model?.supportedGenerationMethods)
          ? model.supportedGenerationMethods
          : []
        return methods.includes('generateContent')
      })
      .map((model) => normalizeModelName(model?.name))
      .filter(Boolean)
      .sort((a, b) => rankModel(a) - rankModel(b) || a.localeCompare(b))

    cachedApiKey = apiKey
    cachedAt = now
    cachedModels = [...new Set(available)]
    return cachedModels
  } catch {
    return []
  }
}
