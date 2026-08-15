import { toString as mdastToString } from 'mdast-util-to-string'
import extractDate from "./../../extractDate.js"
import { testURL, toTitleCase } from "./../../utils.js"
import yaml from 'yaml'
import path from "node:path"

/**
 * @param {object} tree
 * @param {string} filePath
 * @param {string} targetPath
 */
function getMetadata(tree, filePath, targetPath) {
  const metadata = {}

  for (let i = 0; i < tree.children.length; i++) {
    const child = tree.children[i]
    const text = mdastToString(child)
    switch (child.type) {
      case "paragraph":
        if (child.children.length !== 1) {
          if (!metadata.fm_description && !metadata.inferred_description) {
            metadata.inferred_description = text
          }
          i = Infinity
          break
        } else if (child.children[0].type === "image") {
          metadata.inferred_image = child.children[0].url
          metadata.inferred_alt_text = child.children[0].alt
          break
        } else if (testURL(text)) {
          const url = new URL(text)
          if (text.match(/\.(jpeg|jpg|png)$/)) {
            metadata.inferred_image = url
            break
          } else {
            metadata.inferred_link = url
            break
          }
        } else {
          const inferred_date = extractDate(mdastToString(child))
          if (inferred_date) {
            metadata.inferred_date = inferred_date
          } else {
            if (!metadata.fm_description && !metadata.inferred_description) {
              metadata.inferred_description = text
            }
            // tree.children.splice(0, i + 1)
            i = Infinity
          }
          break
        }
      case "heading":
        if (child.depth === 1) {
          metadata.inferred_title = mdastToString(child) || toTitleCase(path.parse(filePath).name)
          tree.children.splice(0, i + 1)
        } else {
          i = Infinity;
        }
        break
      case "yaml":
        const frontmatter = yaml.parse(child.value)
        for (const key in frontmatter) {
          metadata["fm_" + key] = frontmatter[key]
        }
        break
      default:
        i = Infinity
        break
    }
  }


  const pathInfo = path.parse(filePath)
  
  metadata.inferred_label = toTitleCase(pathInfo.name)

  if (targetPath) {
    const targetInfo = path.parse(targetPath)
    const name = targetInfo.name === "index" ? "" : targetInfo.name
    // FIXME the prettyURL should include the preceding slash
    metadata.prettyURL = (new URL(`${targetInfo.dir}/${name}`, "thismessage:/")).pathname
  }

  selectMetadata(metadata)

  return metadata
}



function selectMetadata(metadata) {
  const date =
    metadata.fm_date
    || metadata.inferred_date

  if (date) {
    metadata.date = date
  }

  const title =
    metadata.fm_title
    || metadata.inferred_title
    || metadata.inferred_label

  if (title) {
    metadata.title = title
  }

  const breadcrumb =
    metadata.fm_breadcrumb
    || metadata.title
    || metadata.inferred_label

  if (breadcrumb) {
    metadata.breadcrumb = breadcrumb
  }

  const description =
    metadata.fm_description
    || metadata.tagline
    || metadata.inferred_description

  if (description) {
    metadata.description = description
  }

  const image =
    metadata.fm_image
    || metadata.inferred_image

  if (image) {
    metadata.image = image
  }
}

export default getMetadata