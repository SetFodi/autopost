import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = process.cwd()
const environment = process.env.NODE_ENV || 'production'

function parseEnvFile(contents) {
  const values = {}

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line)
    if (!match) continue

    const key = match[1]
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      const quote = value[0]
      value = value.slice(1, -1)
      if (quote === '"') {
        value = value
          .replaceAll('\\n', '\n')
          .replaceAll('\\r', '\r')
          .replaceAll('\\t', '\t')
      }
    }

    values[key] = value
  }

  return values
}

function loadProjectEnvironment() {
  const filenames = [
    `.env.${environment}.local`,
    ...(environment === 'test' ? [] : ['.env.local']),
    `.env.${environment}`,
    '.env',
  ]

  for (const filename of filenames) {
    const path = join(projectRoot, filename)
    if (!existsSync(path)) continue

    const values = parseEnvFile(readFileSync(path, 'utf8'))
    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] === undefined) process.env[key] = value
    }
  }
}

loadProjectEnvironment()

const manifestPath = join(projectRoot, 'config', 'campaign-assets.json')
const failures = []
const passes = []

function pass(message) {
  passes.push(message)
}

function fail(message) {
  failures.push(message)
}

function requireValue(name, validator, guidance) {
  const value = process.env[name]?.trim() || ''
  if (!value) {
    fail(`${name} is missing. ${guidance}`)
    return
  }
  if (!validator(value)) {
    fail(`${name} is invalid. ${guidance}`)
    return
  }
  pass(`${name} is configured`)
}

function requireOneOf(names, validator, guidance) {
  const configuredEntries = names
    .map((name) => [name, process.env[name]?.trim() || ''])
    .filter(([, value]) => value)

  if (!configuredEntries.length) {
    fail(`${names.join(' or ')} is missing. ${guidance}`)
    return
  }

  const validEntry = configuredEntries.find(([, value]) => validator(value))
  if (!validEntry) {
    fail(`${names.join(' or ')} is invalid. ${guidance}`)
    return
  }

  const [name] = validEntry
  pass(`${name} is configured`)
}

let manifest
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  pass('campaign asset manifest is readable')
} catch {
  fail('config/campaign-assets.json is missing or invalid JSON')
}

const expectedAssetPaths = [
  '/campaign/originals/01.jpg',
  '/campaign/originals/02.jpg',
  '/campaign/originals/03.jpg',
  '/campaign/final/hero-after.jpg',
  '/campaign/final/reel.mp4',
  '/campaign/final/reel-poster.jpg',
  '/campaign/final/stories/01.jpg',
  '/campaign/final/stories/02.jpg',
  '/campaign/final/stories/03.jpg',
  '/campaign/final/carousel/01.jpg',
  '/campaign/final/carousel/02.jpg',
  '/campaign/final/carousel/03.jpg',
  '/campaign/final/carousel/04.jpg',
  '/campaign/final/carousel/05.jpg',
  '/campaign/final/carousel/06.jpg',
  '/campaign/final/marketplace-card.jpg',
]

if (process.env.CAMPAIGN_ASSET_SET?.trim().toLowerCase() === 'real') {
  pass('real campaign asset set is active')
} else {
  fail(
    'CAMPAIGN_ASSET_SET must be "real". Development/demo media cannot be used for a paid campaign.',
  )
}

if (manifest) {
  const manifestAssetPaths = [
    ...(Array.isArray(manifest.originals)
      ? manifest.originals.map((asset) => asset.src)
      : []),
    manifest.final?.heroAfter?.src,
    manifest.final?.reel?.src,
    manifest.final?.reel?.poster,
    ...(Array.isArray(manifest.final?.stories)
      ? manifest.final.stories.map((asset) => asset.src)
      : []),
    ...(Array.isArray(manifest.final?.carousel)
      ? manifest.final.carousel.map((asset) => asset.src)
      : []),
    manifest.final?.marketplaceCard?.src,
  ].filter(Boolean)

  const expectedSet = new Set(expectedAssetPaths)
  const actualSet = new Set(manifestAssetPaths)
  const exactPaths =
    expectedSet.size === actualSet.size &&
    [...expectedSet].every((path) => actualSet.has(path))

  if (exactPaths) {
    pass('manifest uses the documented campaign media paths')
  } else {
    fail(
      'config/campaign-assets.json must use exactly the paths documented in public/campaign/README.md',
    )
  }

  if (manifestAssetPaths.some((path) => path.includes('/demo/'))) {
    fail('real campaign manifest points to development demo media')
  } else {
    pass('real campaign manifest contains no demo media paths')
  }

  const metadataValues = [
    ['vehicle.model', manifest.vehicle?.model],
    ['vehicle.specs', manifest.vehicle?.specs],
    ['vehicle.price', manifest.vehicle?.price],
    ...(manifest.originals || []).map((asset, index) => [
      `originals[${index}].alt`,
      asset.alt,
    ]),
    ['final.heroAfter.alt', manifest.final?.heroAfter?.alt],
    ['final.reel.alt', manifest.final?.reel?.alt],
    ...(manifest.final?.stories || []).map((asset, index) => [
      `final.stories[${index}].alt`,
      asset.alt,
    ]),
    ...(manifest.final?.carousel || []).map((asset, index) => [
      `final.carousel[${index}].alt`,
      asset.alt,
    ]),
    ['final.marketplaceCard.alt', manifest.final?.marketplaceCard?.alt],
    ...(manifest.salesCopy || []).map((item, index) => [
      `salesCopy[${index}].text`,
      item.text,
    ]),
  ]

  const missingMetadata = metadataValues
    .filter(([, value]) => typeof value !== 'string' || !value.trim())
    .map(([name]) => name)

  if (missingMetadata.length) {
    fail(
      `real campaign manifest metadata is incomplete: ${missingMetadata.join(', ')}`,
    )
  } else {
    pass('real vehicle labels, alt text, and sales copy are complete')
  }

  for (const assetPath of expectedAssetPaths) {
    const filesystemPath = join(
      projectRoot,
      'public',
      assetPath.replace(/^\/+/, ''),
    )
    if (!existsSync(filesystemPath)) {
      fail(`required campaign asset is missing: public${assetPath}`)
      continue
    }
    if (
      !statSync(filesystemPath).isFile() ||
      statSync(filesystemPath).size < 1
    ) {
      fail(`required campaign asset is empty or not a file: public${assetPath}`)
      continue
    }
    pass(`found public${assetPath}`)
  }
}

const trackedCtaPath = join(
  projectRoot,
  'src',
  'components',
  'landing',
  'tracked-cta.tsx',
)
const submissionSectionPath = join(
  projectRoot,
  'src',
  'components',
  'landing',
  'submission-section.tsx',
)
const submissionFormPath = join(
  projectRoot,
  'src',
  'components',
  'forms',
  'submission-form.tsx',
)
const examplesPagePath = join(projectRoot, 'src', 'app', 'examples', 'page.tsx')

try {
  const trackedCta = readFileSync(trackedCtaPath, 'utf8')
  const submissionSection = readFileSync(submissionSectionPath, 'utf8')
  const submissionForm = readFileSync(submissionFormPath, 'utf8')
  const exactLabel = 'მიიღე უფასო Preview'
  const targetExists = submissionSection.includes('id="preview-form"')
  const linkTargetsForm = /href=["']\/#preview-form["']/.test(trackedCta)
  const ctaCopyIsConsistent =
    trackedCta.includes(exactLabel) && submissionForm.includes(exactLabel)

  if (targetExists && linkTargetsForm && ctaCopyIsConsistent) {
    pass('primary CTA uses the agreed label and targets the upload form')
  } else {
    fail(
      'primary CTA contract is broken: require "მიიღე უფასო Preview" and a /#preview-form target that works from every route',
    )
  }
} catch {
  fail('primary CTA source files could not be inspected')
}

try {
  const examplesPage = readFileSync(examplesPagePath, 'utf8')
  const usesCampaignSelection = examplesPage.includes(
    'getCampaignAssetSelection',
  )
  const hasBlockedState = examplesPage.includes('CampaignMediaUnavailable')
  const importsDemoMedia = examplesPage.includes('demoAssets')

  if (usesCampaignSelection && hasBlockedState && !importsDemoMedia) {
    pass('examples route uses the production-safe campaign media gate')
  } else {
    fail(
      'examples route must use campaign-selected media, show the blocked-state warning, and never import demo assets directly',
    )
  }
} catch {
  fail('examples route could not be inspected for campaign media safety')
}

requireValue(
  'NEXT_PUBLIC_META_PIXEL_ID',
  (value) => /^\d{5,20}$/.test(value),
  'Add the numeric Pixel ID from Meta Events Manager.',
)
requireValue(
  'NEXT_PUBLIC_SITE_URL',
  (value) => {
    try {
      const url = new URL(value)
      return (
        url.protocol === 'https:' &&
        !['localhost', '127.0.0.1'].includes(url.hostname)
      )
    } catch {
      return false
    }
  },
  'Use the final HTTPS production origin, for example https://autopost.ge.',
)
requireValue(
  'NEXT_PUBLIC_WHATSAPP_NUMBER',
  (value) => {
    const compact = value.replace(/[\s()-]/g, '')
    return /^\+?9955\d{8}$/.test(compact)
  },
  'Use the full Georgian international number, for example +995557100020.',
)
requireValue(
  'NEXT_PUBLIC_OPERATOR_NAME',
  (value) => value.length >= 2,
  'Add the real operator or company name shown in trust/legal information.',
)
requireValue(
  'NEXT_PUBLIC_SUPABASE_URL',
  (value) => {
    try {
      return new URL(value).protocol === 'https:'
    } catch {
      return false
    }
  },
  'Add the production Supabase project URL.',
)
requireOneOf(
  ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  (value) => value.length >= 20,
  'Add the production publishable key (or the documented legacy anon fallback).',
)
requireOneOf(
  ['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  (value) => value.length >= 20,
  'Add the production secret key (or the documented legacy service-role fallback).',
)
requireValue(
  'ADMIN_EMAIL',
  (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  'Add the exact allow-listed Supabase admin email.',
)
requireValue(
  'RATE_LIMIT_IP_HASH_SECRET',
  (value) => value.length >= 32,
  'Use a unique secret containing at least 32 characters.',
)
requireValue(
  'CRON_SECRET',
  (value) => value.length >= 32,
  'Use a separate secret containing at least 32 characters.',
)

async function checkCampaignDatabaseSchema() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !serviceKey) return

  try {
    const response = await fetch(
      `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/submissions?select=seller_type,utm_source,utm_medium,utm_campaign,utm_content,utm_term&limit=0`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      },
    )

    if (response.ok) {
      pass('campaign database migration is applied')
      return
    }

    fail(
      `campaign database migration is not ready (Supabase returned HTTP ${response.status}). Apply the latest migration and refresh the API schema cache.`,
    )
  } catch {
    fail(
      'campaign database migration could not be verified. Confirm network access and the production Supabase credentials.',
    )
  }
}

await checkCampaignDatabaseSchema()

for (const message of passes) console.log(`✓ ${message}`)

if (failures.length) {
  console.error(`\nCampaign readiness blocked (${failures.length} issue(s)):`)
  for (const message of failures) console.error(`✗ ${message}`)
  process.exitCode = 1
} else {
  console.log('\nCampaign readiness check passed.')
}
