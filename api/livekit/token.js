import { readJsonBody } from '../lib/readJsonBody.js'
import { handleLiveKitTokenRequest } from '../lib/livekitToken.js'

export default async function handler(req, res) {
  try {
    req.body = await readJsonBody(req)
  } catch {
    req.body = {}
  }

  await handleLiveKitTokenRequest(req, res)
}
