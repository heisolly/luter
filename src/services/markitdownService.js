const SERVER_URL = import.meta.env.VITE_MARKITDOWN_SERVER_URL || ''

export function isMarkItDownConfigured() {
  return !!SERVER_URL
}

export async function convertWithMarkItDown(file) {
  if (!SERVER_URL) {
    return null
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${SERVER_URL}/convert`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error')
    throw new Error(`MarkItDown server error (${response.status}): ${errorBody}`)
  }

  return response.json()
}
