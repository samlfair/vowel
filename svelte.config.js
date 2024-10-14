import adapter from '@sveltejs/adapter-static';
import path, { join } from 'path';
import mri from 'mri';

const args = mri(process.argv);
const homeDir = args.directory;
const relativePathToHome = path.relative(process.cwd(), homeDir || '/');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			pages: join(relativePathToHome, '.output'),
			assets: join(relativePathToHome, '.output'),
			strict: false
		}),
		files: {
			assets: join(relativePathToHome, 'assets')
		},
		prerender: {
			handleHttpError: 'warn',
			entries: ['*', '/', '/robots.txt', '/sitemap.xml', '/feed.xml', '/404']
		}
	}
};

export default config;
