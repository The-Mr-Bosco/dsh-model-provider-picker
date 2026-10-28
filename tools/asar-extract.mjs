// Minimal ASAR extractor (no dependencies) for inspecting the bundled DSH client sources.
import { open, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

const [archivePath, outDir, prefix = ''] = process.argv.slice(2)
if (!archivePath || !outDir) {
  console.error('usage: node asar-extract.mjs <archive.asar> <outDir> [pathPrefix]')
  process.exit(1)
}

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

  let extracted = 0
  const walk = async (node, path) => {
    for (const [name, entry] of Object.entries(node.files)) {
      const full = path ? `${path}/${name}` : name
      if (entry.files) {
        await walk(entry, full)
        continue
      }
      if (prefix && !full.startsWith(prefix)) continue
      const target = resolve(outDir, full.slice(prefix ? prefix.length : 0).replace(/^\/+/, ''))
      await mkdir(dirname(target), { recursive: true })
      const buf = Buffer.alloc(entry.size)
      await handle.read(buf, 0, entry.size, dataOffset + Number(entry.offset))
      await writeFile(target, buf)
      extracted += 1
      console.log(full)
    }
  }
  await walk(json, '')
  console.error(`extracted ${extracted} file(s)`)
} finally {
  await handle.close()
}
