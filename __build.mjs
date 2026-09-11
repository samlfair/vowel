import fs from "node:fs"; import path from "node:path"
import votive from "votive"; import { createConfig } from "./config.js"
const [source, out] = process.argv.slice(2)
const config = createConfig(source, { targetFolder: path.join(out,"output"), databasePath: path.join(out,".votive.db"), cacheDirectory: path.join(out,".cache"), verbose: false })
fs.mkdirSync(config.targetFolder, { recursive: true })
const site = await votive(config)
await (await site.build()).deferred
await site.close()
