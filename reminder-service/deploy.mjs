// Uses Wrangler's existing OAuth login; never prints or writes secrets.
import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
const root = dirname(fileURLToPath(import.meta.url))
const account = '3cc685d9859548e679dfe6eae34e7a5c'
const wrangler = join(root, 'node_modules/wrangler/bin/wrangler.js')
async function cli(args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wrangler, ...args], { cwd: root, stdio: [input ? 'pipe' : 'ignore', 'inherit', 'inherit'], windowsHide: true })
    if (input) child.stdin.end(input)
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Wrangler failed (${code})`)))
  })
}
const credentials = await readFile(join(process.env.APPDATA, 'xdg.config/.wrangler/config/default.toml'), 'utf8')
const token = credentials.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1]
if (!token) throw new Error('Run Wrangler login first')
async function api(path, method = 'GET', body) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const result = await response.json()
  if (!result.success) throw new Error(`Cloudflare API failed (${response.status}): ${result.errors?.map(e => e.code).join(',')}`)
  return result.result
}
// Read-only permission probe before making any changes.
await api('workers/scripts')
let db = (await api('d1/database?name=kuanxinji-reminders')).find(item => item.name === 'kuanxinji-reminders')
if (!db) db = await api('d1/database', 'POST', { name: 'kuanxinji-reminders' })
const configPath = join(root, 'wrangler.jsonc')
const config = JSON.parse(await readFile(configPath, 'utf8'))
config.account_id = account
config.d1_databases[0].database_id = db.uuid
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
await cli(['d1', 'execute', 'kuanxinji-reminders', '--remote', '--file', 'schema.sql'])
const scripts = await api('workers/scripts')
const exists = scripts.some(s => s.id === config.name)
if (!exists) {
  // Generate once; secrets go only to Cloudflare through Wrangler stdin.
  const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const privateKey = await crypto.subtle.exportKey('jwk', keys.privateKey)
  const publicKey = Buffer.from(await crypto.subtle.exportKey('raw', keys.publicKey)).toString('base64url')
  await cli(['secret', 'bulk'], JSON.stringify({ VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: privateKey.d }))
} else {
  const secrets = await api(`workers/scripts/${config.name}/secrets`)
  if (!['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'].every(name => secrets.some(s => s.name === name))) throw new Error('Existing service has incomplete VAPID secrets. Restore keys; never rotate silently.')
}
await cli(['deploy'])
const project = await api('pages/projects/kuanxinji')
const deployment_configs = {}
for (const name of ['production', 'preview']) {
  deployment_configs[name] = { services: { ...project.deployment_configs[name]?.services, REMINDER_SERVICE: { service: config.name, environment: 'production' } } }
}
await api('pages/projects/kuanxinji', 'PATCH', { deployment_configs })
const verified = await api('pages/projects/kuanxinji')
if (verified.deployment_configs.production.services?.REMINDER_SERVICE?.service !== config.name) throw new Error('Pages binding was not persisted')
console.log('Reminder service deployed; Pages binding configured. Publish the matching Pages source and verify /api/reminders/config after cron starts.')

