import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';
import { readMarkdownFile, loadCache } from './src/lib/utilities/index';
import mri from 'mri';

const args = mri(process.argv);

const demoDir = process.cwd() + '/content';
const NPMRunDev = process.argv[2] === 'dev';
const isBuild = process.argv[2] === 'build';
const receivedHomePath = NPMRunDev || isBuild ? false : args.directory;

const homeDir = receivedHomePath || demoDir;

const $home = [homeDir];

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			// Hot reload markdown
			name: 'markdown:watch',
			configureServer(server) {
				server.watcher.add(homeDir);
				server.watcher.on('add', () => {
					server.ws.send('vowel:refresh');
				});
				server.watcher.on('unlink', () => {
					server.ws.send('vowel:refresh');
				});
				server.watcher.on('change', async (homePath, stats) => {
					if (homePath.endsWith('.md')) {
						// Remove `.md`
						const cache = await loadCache(homeDir);
						const file = await readMarkdownFile(homePath, cache);
						Object.assign(file, file.frontmatter);
						const relativePath = path
							.relative(homeDir, homePath)
							.slice(0, -3)
							.replace(/\/?(home)$/, '')
							.replace(/\/?(settings)$/, '_');
						server.ws.send('vowel:update', {
							path: relativePath,
							stats,
							file
						});
					}
				});
			}
		}
	],
	define: { $home },
	optimizeDeps: {
		exclude: ['svelte', 'remark', 'remark-frontmatter', 'remark-html'],
		include: [
			'micromark',
			'unified',
			'fault',
			'url-metadata',
			'any-date-parser',
			'any-date-parser/src/formats/ago/ago.js',
			'any-date-parser/src/formats/ago/ago.js',
			'any-date-parser/src/formats/chinese/chinese.js',
			'any-date-parser/src/formats/dayMonth/dayMonth.js',
			'any-date-parser/src/formats/dayMonthname/dayMonthname.js',
			'any-date-parser/src/formats/monthDay/monthDay.js',
			'any-date-parser/src/formats/monthnameDay/monthnameDay.js',
			'any-date-parser/src/formats/today/today.js'
		]
	},
	server: {
		fs: {
			strict: false,
			allow: homeDir
		},
		hmr: {
			overlay: false
		}
	},
	resolve: {
		// extensions: ['.css']
	}
});
