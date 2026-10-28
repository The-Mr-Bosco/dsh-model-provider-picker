// Grep inside an ASAR archive without extracting it.
// usage: node asar-grep.mjs <archive.asar> <substring> [pathPrefix] [maxHits]
import { open } from 'node:fs/promises'

const [archivePath, needle, prefix = 'dsh/node_modules/', maxHitsRaw = '40'] = process.argv.slice(2)
if (!archivePath || !needle) {
  console.error('usage: node asar-grep.mjs <archive.asar> <substring> [pathPrefix] [maxHits]')
  process.exit(1)
}
const maxHits = Number(maxHitsRaw)
const handle = await open(archivePath, 'r')
try {
  const sizeBuf = Buffer.alloc(8)
  await handle.read(sizeBuf, 0, 8, 0)
  const headerPickleSize = sizeBuf.readUInt32LE(4)
  const headerBuf = Buffer.alloc(headerPickleSize)
  await handle.read(headerBuf, 0, headerPickleSize, 8)
  const jsonSize = headerBuf.readUInt32LE(4)
  const json = JSON.parse(headerBuf.subarray(8, 8 + jsonSize).toString('utf8'))
  const dataOffset = 8 + headerPickleSize

  let hits = 0
  const walk = async (node, path) => {
    for (const [name, entry] of Object.entries(node.files)) {
      if (hits >= maxHits) return
      const full = path ? `${path}/${name}` : name
      if (entry.files) {
        await walk(entry, full)
        continue
      }
      if (!full.startsWith(prefix)) continue
      if (!/\.(js|mjs|cjs|ts|json|md)$/.test(name)) continue
      if (entry.link !== undefined) continue
      if (entry.size > 12 * 1024 * 1024) continue
      if (entry.offset === undefined) continue
      const buf = Buffer.alloc(entry.size)
      await handle.read(buf, 0, entry.size, dataOffset + Number(entry.offset))
      const text = buf.toString('utf8')
      let at = text.indexOf(needle)
      while (at !== -1 && hits < maxHits) {
        const lineStart = text.lastIndexOf('\n', at) + 1
        const lineEnd = text.indexOf('\n', at)
        console.log(`${full}:${text.slice(0, at).split('\n').length}: ${text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).trim().slice(0, 300)}`)
        hits += 1
        at = text.indexOf(needle, at + needle.length)
      }
    }
  }
  await walk(json, '')
  console.error(`--- ${hits} hit(s)`)
} finally {
  await handle.close()
}
