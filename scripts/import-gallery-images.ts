/**
 * One-shot migration: upload the original WordPress gallery photos into the
 * Sanity category gallery documents (gallery-page-<wpPageId>), in slot order,
 * so the backoffice at /studio manages the real media.
 *
 * Sources:
 *   - content/galleries.ts        slot order + wp-attachment-<id> sourceRefs
 *   - content/media-manifest.json attachment id -> uploads-relative file path
 *   - cPanel backup uploads dir   the actual binaries (BACKUP_UPLOADS below)
 *
 * Run:  npx sanity exec scripts/import-gallery-images.ts --with-user-token
 *
 * Idempotent-by-default: galleries that already have images in Sanity are
 * skipped (the backoffice owns them once populated). FORCE=1 re-imports.
 */
import {createReadStream, existsSync, readFileSync} from 'node:fs'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'
import {galleries} from '../content/galleries'

const BACKUP_UPLOADS =
  '/Users/noam.meron/Documents/personal/backup-7.11.2026_06-52-32_omrimero/homedir/public_html/wp-content/uploads'

interface ManifestEntry {
  file: string
  mime: string
  width?: number
  height?: number
}

const manifest: Record<string, ManifestEntry> = JSON.parse(
  readFileSync(path.join(__dirname, '../content/media-manifest.json'), 'utf8'),
)

const client = getCliClient({apiVersion: '2026-07-11'})

async function importGallery(gallery: (typeof galleries)[number]) {
  const existing = await client.fetch<number | null>(
    `count(*[_type == "gallery" && _id == $id][0].images)`,
    {id: gallery._id},
  )
  if (existing && existing > 0 && !process.env.FORCE) {
    console.log(`- ${gallery.name}: already has ${existing} images in Sanity, skipping (FORCE=1 to re-import)`)
    return
  }

  const images = []
  for (const slot of gallery.slots) {
    const wpId = slot.sourceRef.match(/^wp-attachment-(\d+)$/)?.[1]
    const entry = wpId ? manifest[wpId] : undefined
    if (!entry) {
      console.warn(`  ! ${gallery.name} slot ${slot.position}: no manifest entry for ${slot.sourceRef}, skipped`)
      continue
    }
    const filePath = path.join(BACKUP_UPLOADS, entry.file)
    if (!existsSync(filePath)) {
      console.warn(`  ! ${gallery.name} slot ${slot.position}: missing file ${entry.file}, skipped`)
      continue
    }
    const asset = await client.assets.upload('image', createReadStream(filePath), {
      filename: path.basename(entry.file),
    })
    // alt intentionally left unset: portfolio photos are decorative; the
    // owner can fill alts in the Studio where they add value
    images.push({
      _type: 'image' as const,
      _key: `wp-${wpId}`,
      asset: {_type: 'reference' as const, _ref: asset._id},
    })
    process.stdout.write(`  ${gallery.name}: ${images.length}/${gallery.slots.length}\r`)
  }

  await client.createOrReplace({
    _id: gallery._id,
    _type: 'gallery',
    title: gallery.name,
    images,
  })
  console.log(`✓ ${gallery.name}: ${images.length}/${gallery.slots.length} images imported`)
}

async function main() {
  // the 10 category gallery documents pinned in the Studio structure;
  // standalone source galleries are out of scope
  const categoryGalleries = galleries.filter((g) => !g.standalone)
  console.log(`Importing ${categoryGalleries.length} category galleries into ${client.config().projectId}/${client.config().dataset}`)
  for (const gallery of categoryGalleries) {
    await importGallery(gallery)
  }
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
