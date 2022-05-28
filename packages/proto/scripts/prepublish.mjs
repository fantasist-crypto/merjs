import fs from 'node:fs/promises'

const items = await fs.readdir('dist')

const tasks = items.map(item => fs.symlink(`dist/${item}`, item))

await Promise.all(tasks)
