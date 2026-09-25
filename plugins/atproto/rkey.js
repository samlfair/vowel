/**
 * A page's record key, derived from its canonical URL: the site's origin
 * and the page's published path, e.g. "https://example.com/blog/post".
 *
 * Deterministic, so the AT-URI is known on the first build, before any
 * record exists, and the same page gets the same key on every machine. No
 * ledger: the URL is the identity. The domain is part of it, so two sites
 * publishing to one account never share a key, and a site that changes
 * domain gets new keys: the documents now live somewhere else. The old
 * records are *not* deleted by the next publish, because their `site` is
 * the old domain and publish only deletes records whose `site` is this
 * site's. A move that changes one page's URL, on the same domain, does
 * delete that page's old record.
 *
 * `site.standard.document` declares `key: tid`, so the key must be shaped
 * like a TID: 13 characters of base32-sortable, with the top bit clear.
 * It is 63 bits of FNV-1a over the URL's UTF-8 bytes, which clears the
 * top bit by construction. A real TID encodes a timestamp and this one
 * does not, so keys do not sort by date. Nothing in site.standard relies
 * on that.
 *
 * **The function is frozen once anything is published.** Changing the
 * hash, its input or its encoding moves every page to a new key. The
 * next publish would then delete and recreate every record.
 */

const ALPHABET = "234567abcdefghijklmnopqrstuvwxyz"
const OFFSET = 0xcbf29ce484222325n
const PRIME = 0x100000001b3n
const MASK_64 = (1n << 64n) - 1n
const MASK_63 = (1n << 63n) - 1n
const LENGTH = 13

/** @param {string} text */
function fnv1a63(text) {
  const bytes = Buffer.from(text, "utf8")
  const hash = bytes.reduce((h, byte) => ((h ^ BigInt(byte)) * PRIME) & MASK_64, OFFSET)
  return hash & MASK_63
}

/**
 * @param {string} canonicalURL - e.g. "https://example.com/blog/post"
 * @returns {string} a TID-shaped record key
 */
function createRkey(canonicalURL) {
  const hash = fnv1a63(canonicalURL)
  const characters = Array.from({ length: LENGTH }, (_, index) => {
    const shift = BigInt(5 * (LENGTH - 1 - index))
    return ALPHABET[Number((hash >> shift) & 31n)]
  })
  return characters.join("")
}

export default createRkey
