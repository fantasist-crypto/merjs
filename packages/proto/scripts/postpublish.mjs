import fs from 'node:fs/promises'

const items = await fs.readdir('dist')

const tasks = items.map(item => fs.unlink(item).catch(() => {}))

await Promise.all(tasks)
