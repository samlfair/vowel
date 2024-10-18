import fs from 'fs/promises';
import { remark } from 'remark';
import remarkFrontmatter from 'remark-frontmatter';
import remarkDirective from 'remark-directive';
import remarkHTML from 'remark-html';
import remarkGFM from 'remark-gfm';
import yaml from 'js-yaml';
import { toString } from 'mdast-util-to-string';
import path from 'path';

import { mutateMarkdownAST, mutateMarkdownFrontmatter } from '.';

/**
 * @typedef {Object} FrontmatterNode
 * @property {"yaml"} type - The type is yaml.
 * @property {string} value - The value of the node.
 * @property {Object} [position] - The position of the node.
 */

/**
 * Parse a frontmatter node to a JS object.
 * @param {FrontmatterNode | undefined} frontmatterNode - A markdown node of type "yaml".
 * @returns {Object} A JS object containing the frontmatter
 */
function parseFrontmatter(frontmatterNode) {
	if (!frontmatterNode) return {};
	const frontmatter = yaml.load(frontmatterNode.value);
	if (frontmatter && typeof frontmatter === 'object') {
		return frontmatter;
	}
	return {};
}

function deduceDescriptionFromAST(ast) {
	for (let i = 0; i < ast?.length; i++) {
		if (ast?.[i]?.type === 'paragraph') {
			const firstParagraph = toString(ast[i]);
			if (firstParagraph.length > 150) {
				return firstParagraph.slice(0, 150);
			} else if (firstParagraph.length > 1) {
				return firstParagraph;
			}
		}
	}
	return null;
}

function deduceImageFromAST(ast) {
	for (let i = 0; i < ast?.length; i++) {
		const node = ast?.[i]
		if (node.type === 'figure') {
			for(let i = 0; i < node.children.length; i++) {
				const child = node.children[i]
				if(child.type === "image") {
					return child.url
				}
			}
		}
	}
	return null;
}

function demoteHeadings(ast, start) {
	for (let i = start; i < ast.length; i++) {
		const node = ast[i];
		if (node.type === 'heading') {
			node.depth = node.depth + 1;
		}
	}
}

function checkHeadings(ast, start = 1) {
	for (let i = start; i < ast.length; i++) {
		if (ast[i]?.depth === 1) {
			return true;
		}
	}
	return false;
}

function extractTitleFromHeading(node) {
	return node?.children?.[0].value;
}

function imputeTitleFromAST(ast) {
	if (ast?.[0]?.depth === 1) {
		return extractTitleFromHeading(ast[0]);
	}

	return null;
}

/**
 * @typedef {Object} ParsedMarkdown
 * @property {Object.<string, *>} [frontmatter] - Metadata for the document.
 * @property {Array<Object>} ast - The content of the document.
 * @property {Object} imputedProperties - Metadata imputed from content.
 * @property {string} [url] - URL for the page.
 * @description An object containing the parsed frontmatter and filtered AST.
 */

/**
 * Reads a Markdown file and parses its content into frontmatter and abstract syntax tree (AST).
 * It also filters out YAML frontmatter nodes from the AST.
 *
 * @async
 * @function
 * @param {string} filePath - The path to the Markdown file.
 * @param {Object} cache - An optional cache object that can be passed to mutate the AST.
 * @returns {Promise<ParsedMarkdown>}
 * @throws {Error} Will throw an error if the file cannot be read or parsed.
 */
export default async function readMarkdownFile(filePath, cache, publishedData, url) {
	const fileName = path.basename(filePath.slice(0, -3));

	const fileContent = await fs.readFile(filePath, 'utf8');
	const markdownParser = remark().use(remarkFrontmatter, ['yaml']).use(remarkHTML);

	const parsedMarkdown = markdownParser.parse(fileContent);
	const frontmatterNode = parsedMarkdown.children.find((node) => node.type === 'yaml');
	const frontmatter = frontmatterNode?.type === 'yaml' ? parseFrontmatter(frontmatterNode) : {};
	const ast = remark()
		.use(remarkDirective)
		.use(remarkFrontmatter)
		.use(remarkGFM)
		.parse(fileContent);

	const footnotes = [];

	for (let i = 0; i < ast.children.length; i++) {
		if (ast.children[i].type === 'footnoteDefinition') {
			footnotes.push(ast.children[i]);
		}
	}

	if (footnotes.length) {
		ast.children.push({
			type: 'footnotes',
			children: footnotes
		});
	}

	// ast.children.sort((a, b) => {
	// 	if (a.type !== 'footnoteDefinition' && b.type === 'footnoteDefinition') return -1;
	// 	return 0;
	// });

	const filteredAST = ast.children.filter((child) => child.type !== 'yaml');

	const imputedTitle = imputeTitleFromAST(filteredAST);

	if (imputedTitle) {
		filteredAST.shift();
	}

	if (imputedTitle && checkHeadings(filteredAST, 1)) {
		demoteHeadings(filteredAST, 1);
	}

	if (!frontmatter.title && imputedTitle) frontmatter.title = imputedTitle;

	

	const imputedProperties = {
		description: deduceDescriptionFromAST(filteredAST),
		title: imputedTitle,
		fileName
	};


	const webmentions = publishedData?.webmentions

	const promises = [mutateMarkdownAST(ast.children, cache, webmentions, url)];

	// Don't mutate frontmatter on the settings pages
	if (!filePath.endsWith('settings.md'))
		promises.push(mutateMarkdownFrontmatter(frontmatter, cache, webmentions));

	await Promise.all(promises);

	const imputedImage = deduceImageFromAST(filteredAST)

	if(imputedImage) {
		imputedProperties.image = imputedImage
	}
	
	return { frontmatter, ast: filteredAST, imputedProperties };
}
