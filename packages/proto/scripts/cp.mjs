import fs from 'node:fs/promises'

const items = await fs.readdir('dist')

const tasks = items.map(item => fs.cp(`dist/${item}`, item, { force: true, recursive: true }))

await Promise.all(tasks)
