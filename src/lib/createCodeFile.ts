import { framer } from "@framer/plugin"

export async function createCodeFileWithDedup(baseName: string, source: string, maxAttempts = 10) {
  const ext = baseName.endsWith(".tsx") ? ".tsx" : ".ts"
  const stem = baseName.slice(0, -ext.length)
  let name = baseName
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await framer.createCodeFile(name, source)
    } catch {
      name = `${stem}${i + 2}${ext}`
    }
  }
  throw new Error(`Could not create code file after ${maxAttempts} attempts`)
}
