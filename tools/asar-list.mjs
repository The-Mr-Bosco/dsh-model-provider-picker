// List ASAR entries under a path prefix without extracting them.
// usage: node asar-list.mjs <archive.asar> <pathPrefix>
import { open } from 'node:fs/promises'

const [archivePath, prefix = ''] = process.argv.slice(2)
const handle = await open(archivePath, 'r')
try {
  const sizeBuf = Buffer.alloc(8)
  await handle.read(sizeBuf, 0, 8, 0)
  const headerPickleSize = sizeBuf.readUInt32LE(4)
  const headerBuf = Buffer.alloc(headerPickleSize)
  await handle.read(headerBuf, 0, headerPickleSize, 8)
  const jsonSize = headerBuf.readUInt32LE(4)
  const json = JSON.parse(headerBuf.subarray(8, 8 + jsonSize).toString('utf8'))

  const walk = async (node, path) => {
    for (const [name, entry] of Object.entries(node.files)) {
      const full = path ? `${path}/${name}` : name
      if (entry.files) {
        if (prefix && !full.startsWith(prefix) && !prefix.startsWith(full + '/')) continue
        await walk(entry, full)
        continue
      }
      if (prefix && !full.startsWith(prefix)) continue
      console.log(full)
    }
  }
  await walk(json, '')
} finally {
  await handle.close()
}
