import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const url = process.env.VITE_SUPABASE_URL
if (!url) {
  console.error('Falta VITE_SUPABASE_URL en .env.local')
  process.exit(1)
}

const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/)
if (!match) {
  console.error(`No se pudo extraer el project-id de VITE_SUPABASE_URL: ${url}`)
  process.exit(1)
}
const projectId = match[1]

const output = execSync(
  `npx supabase gen types typescript --project-id ${projectId} --schema public`,
  { encoding: 'utf8' }
)

writeFileSync('src/types/database.d.ts', output)
console.log(`Tipos generados en src/types/database.d.ts (project-id: ${projectId})`)
