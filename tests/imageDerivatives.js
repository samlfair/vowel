import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import sharp from "sharp"
import votive from "votive"
import { createConfig } from "../config.js"

/**
 * An image's derivatives (four widths × avif, webp, its own format) are
 * the image's owned targets, so a warm start keeps them, a changed image
 * replaces them, and a deleted image removes them. They used to be loose
 * files the startup sweep deleted on the second launch.
 */

async function build(sourceFolder, systemFolder) {
  const site = await votive(createConfig(sourceFolder, {
    targetFolder: path.join(systemFolder, "output"),
    databasePath: path.join(systemFolder, ".votive.db"),
    cacheDirectory: path.join(systemFolder, ".cache"),
    logging: "silent"
  }))
  // One build: the image's read is deferred, returns the derivatives as
  // its owned targets, and \`deferred\` covers the follow-up that writes
  // them.
  await (await site.build()).deferred
  return site
}

const derivatives = async (targetFolder) => (await readdir(targetFolder)).filter(f => /^pic-[0-9a-f]{8}-\d+\.(avif|webp|jpg)$/.test(f)).sort()

test("derivatives survive a warm start, follow the image's content, and go with it", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-derivatives-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-derivatives-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n\n![a picture](/pic.jpg)\n")
    await sharp({ create: { width: 800, height: 500, channels: 3, background: "#4060a0" } }).jpeg().toFile(path.join(sourceFolder, "pic.jpg"))

    // Cold.
    site = await build(sourceFolder, systemFolder)
    const first = await derivatives(targetFolder)
    assert.equal(first.length, 12, `twelve derivatives: ${first}`)
    const hash = first[0].match(/^pic-([0-9a-f]{8})-/)[1]
    const home = await readFile(path.join(targetFolder, "index.html"), "utf-8")
    assert.ok(home.includes(`/pic-${hash}-414.avif`), "the page's srcset names them")
    assert.ok(home.includes("width=800"), "and carries the measured size")
    const rows = site.database.raw.prepare("SELECT COUNT(*) AS n FROM targets WHERE path LIKE 'pic-%' AND source = 'pic.jpg'").get().n
    assert.equal(rows, 12, "each derivative is a target owned by the image")
    assert.equal(site.database.raw.prepare("SELECT COUNT(*) AS n FROM sources WHERE path LIKE 'pic%'").get().n, 1, "pic.jpg is a source; its derivatives are not")
    await site.close()

    // Warm: a second launch, nothing changed.
    site = await build(sourceFolder, systemFolder)
    assert.deepEqual(await derivatives(targetFolder), first, "the sweep keeps what rows claim")
    assert.equal(site.database.raw.prepare("SELECT COUNT(*) AS n FROM targets WHERE stale = 1").get().n, 0)
    await site.close()

    // The image changes: a new hash, a new set, the old set gone.
    await sharp({ create: { width: 640, height: 400, channels: 3, background: "#a04060" } }).jpeg().toFile(path.join(sourceFolder, "pic.jpg"))
    site = await build(sourceFolder, systemFolder)
    const second = await derivatives(targetFolder)
    assert.equal(second.length, 12)
    assert.ok(!second.some(f => f.includes(hash)), "no derivative of the old bytes remains")
    assert.ok((await readFile(path.join(targetFolder, "index.html"), "utf-8")).includes(second[0].replace(/-\d+\.\w+$/, "")), "the page names the new set")
    const meta = await sharp(path.join(targetFolder, second.find(f => f.endsWith("-414.webp")))).metadata()
    assert.equal(meta.width, 414)
    assert.equal(meta.format, "webp")
    await site.close()

    // The image goes: so do its derivatives.
    await rm(path.join(sourceFolder, "pic.jpg"))
    site = await build(sourceFolder, systemFolder)
    assert.deepEqual(await derivatives(targetFolder), [])
    assert.equal(site.database.raw.prepare("SELECT COUNT(*) AS n FROM targets WHERE path LIKE 'pic-%'").get().n, 0)
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})

test("an opaque image gets an inlined placeholder behind it; one with transparency doesn't", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-placeholder-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-placeholder-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n\n![opaque](/pic.jpg)\n\n![clear](/logo.png)\n")
    await sharp({ create: { width: 800, height: 500, channels: 3, background: "#4060a0" } }).jpeg().toFile(path.join(sourceFolder, "pic.jpg"))
    await sharp({ create: { width: 400, height: 400, channels: 4, background: { r: 200, g: 40, b: 40, alpha: 0.5 } } }).png().toFile(path.join(sourceFolder, "logo.png"))

    site = await build(sourceFolder, systemFolder)
    const home = await readFile(path.join(targetFolder, "index.html"), "utf-8")
    const pictures = home.match(/<picture[^>]*>/g)
    assert.equal(pictures.length, 2)
    const [opaque, clear] = pictures

    const uri = opaque.match(/--url-image-placeholder: url\((data:image\/webp;base64,[A-Za-z0-9+/=]+)\)/)?.[1]
    assert.ok(uri, `the opaque image's <picture> carries a WebP data URI: ${opaque}`)
    const tiny = await sharp(Buffer.from(uri.split(",")[1], "base64")).metadata()
    assert.equal(Math.max(tiny.width, tiny.height), 16, "16 px on its long side")
    assert.ok(uri.length < 400, `small enough to inline: ${uri.length} bytes`)
    assert.match(opaque, /--color-image-dominant: #/, "the dominant colour is still there")

    assert.doesNotMatch(clear, /--url-image-placeholder/, "nothing that would show through transparency")
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})

test("a relative image is the page's, and is optimised like any other", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-relative-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-relative-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
    await mkdir(path.join(sourceFolder, "blog"), { recursive: true })
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n")
    await writeFile(path.join(sourceFolder, "blog", "post.md"), "# Post\n\n![dot](./here.jpg)\n\n![bare](here.jpg)\n\n![up](../top.jpg)\n")
    const make = (file) => sharp({ create: { width: 600, height: 400, channels: 3, background: "#806040" } }).jpeg().toFile(file)
    await make(path.join(sourceFolder, "blog", "here.jpg"))
    await make(path.join(sourceFolder, "top.jpg"))

    site = await build(sourceFolder, systemFolder)
    const post = await readFile(path.join(targetFolder, "blog", "post.html"), "utf-8")
    const pictures = post.match(/<picture[^>]*>[\s\S]*?<\/picture>/g) ?? []
    assert.equal(pictures.length, 3, `each image is a <picture>: ${post.match(/<section id=content>[\s\S]*?<\/section>/)[0]}`)
    assert.match(pictures[0], /srcset="?\/blog\/here-[0-9a-f]{8}-414\.avif/, "./here.jpg is blog/here.jpg")
    assert.match(pictures[1], /srcset="?\/blog\/here-[0-9a-f]{8}-414\.avif/, "here.jpg too")
    assert.match(pictures[2], /srcset="?\/top-[0-9a-f]{8}-414\.avif/, "../top.jpg is the root's")
    assert.match(pictures[0], /width=600/, "with its measured size")
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})

test("a png or jpeg is never published at full size: every link to it names a derivative", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-originals-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-originals-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  let site
  try {
    await writeFile(path.join(sourceFolder, "settings.md"), "---\nlogo: logo.png\nsocial_links:\n  - label: Home\n    url: https://example.com\n    icon: badge.png\n---\n")
    await writeFile(path.join(sourceFolder, "home.md"), "---\nimage: pic.jpg\n---\n# Home\n\n![a picture](/pic.jpg)\n\n[The full picture](/pic.jpg)\n")
    const make = (file, format) => sharp({ create: { width: 600, height: 400, channels: 3, background: "#406080" } })[format]().toFile(path.join(sourceFolder, file))
    await make("pic.jpg", "jpeg")
    await make("logo.png", "png")
    await make("badge.png", "png")
    await make("favicon.png", "png")
    await make("anim.gif", "gif")

    site = await build(sourceFolder, systemFolder)
    const files = await readdir(targetFolder)
    for (const original of ["pic.jpg", "logo.png", "badge.png"]) {
      assert.ok(!files.includes(original), `${original} is not published`)
    }
    assert.ok(files.includes("favicon.png"), "the root favicon.png is, as the site's icon")
    assert.ok(files.includes("anim.gif"), "a gif is copied through as before")

    const pic = site.database.target.get("pic.jpg")
    assert.equal(pic.write, false, "the original is a virtual target")
    assert.deepEqual(pic.metadata.derivatives.map(entry => entry.format), [...Array(4).fill("avif"), ...Array(4).fill("webp"), ...Array(4).fill("jpg")], "grouped in <picture> order")
    for (const entry of pic.metadata.derivatives) assert.ok(files.includes(entry.path), `${entry.path} is published`)

    const home = await readFile(path.join(targetFolder, "index.html"), "utf-8")
    assert.doesNotMatch(home, /\/(pic\.jpg|logo\.png|badge\.png)\b/, "nothing names an original")
    assert.match(home, /property="?og:image"? content="?\/pic-[0-9a-f]{8}-1920\.jpg/, "og:image is the largest derivative")
    assert.match(home, /<img id=logo src=\/logo-[0-9a-f]{8}-414\.png/, "the logo is the smallest")
    assert.match(home, /<img src=\/badge-[0-9a-f]{8}-414\.png/, "so is a social link's icon")
    assert.match(home, /href=\/pic-[0-9a-f]{8}-1920\.jpg>The full picture/, "a link to the image opens the largest")
    assert.match(home, /rel=icon[^>]*href=\/favicon\.png|href=\/favicon\.png[^>]*rel=icon/, "the favicon is linked as it is")
  } finally {
    if (site) await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})

test("an image not read yet holds a 3:2 box, and gets its own size when it is read", async () => {
  const sourceFolder = await mkdtemp(path.join(tmpdir(), "vowel-pending-"))
  const systemFolder = await mkdtemp(path.join(tmpdir(), "vowel-pending-sys-"))
  const targetFolder = path.join(systemFolder, "output")
  const site = await votive(createConfig(sourceFolder, {
    targetFolder,
    databasePath: path.join(systemFolder, ".votive.db"),
    cacheDirectory: path.join(systemFolder, ".cache"),
    logging: "silent"
  }))
  try {
    await writeFile(path.join(sourceFolder, "home.md"), "# Home\n\n![a picture](/pic.jpg)\n")
    // Large enough that its deferred read is still running when the
    // foreground pass has written the page.
    const noise = Buffer.alloc(2000 * 1200 * 3).map(() => Math.random() * 255)
    await sharp(noise, { raw: { width: 2000, height: 1200, channels: 3 } }).jpeg().toFile(path.join(sourceFolder, "pic.jpg"))

    const { deferred } = await site.build()
    const before = await readFile(path.join(targetFolder, "index.html"), "utf-8")
    assert.match(before, /<img src=\/pic\.jpg alt="a picture"\s?width=1500 height=1000/, "a stand-in box before the read")

    await deferred
    const after = await readFile(path.join(targetFolder, "index.html"), "utf-8")
    assert.match(after, /<picture[\s\S]*width=2000 height=1200[\s\S]*<\/picture>/, "its own size once read")
    assert.doesNotMatch(after, /width=1500/)
  } finally {
    await site.close()
    await rm(sourceFolder, { recursive: true, force: true })
    await rm(systemFolder, { recursive: true, force: true })
  }
})
