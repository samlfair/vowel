import { fileURLToPath } from 'url';
import { createServer, build } from 'vite';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import mri from 'mri';

const args = mri(process.argv);
const { build: isBuild, directory, publish } = args;

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// If this is not a build, read the process argument
const arg = !isBuild ? process.argv[2] : false;

// Check if this is a user (process argument) or package dev (cwd)
const $home = isBuild ? process.cwd() : directory;

const define = {
	$home: [directory],
	$build: [isBuild],
	$publish: [publish]
};

const config = {
	// any valid user config options, plus `mode` and `configFile`
	configFile: join(__dirname, 'vite.config.js'),
	root: __dirname,
	server: {
		port: 1337
	},
	define
};

const vercelDefaults = {
	cleanUrls: true,
	outputDirectory: '.output',
	buildCommand: null
};

async function buildProject() {
	const outputDir = join($home[0], '.output');

	const vercelConfigPath = join($home[0], 'vercel.json');

	const vercelDirPath = join($home[0], '.vercel');
	const projectJsonPath = join(vercelDirPath, 'project.json');
	let projectData = null;

	try {
		if (existsSync(projectJsonPath)) {
			const data = await readFile(projectJsonPath, 'utf-8');
			projectData = JSON.parse(data);
		}

		await build(config);

		if (projectData !== null) {
			await mkdir(vercelDirPath, { recursive: true });
			await writeFile(projectJsonPath, JSON.stringify(projectData, null, 2), 'utf-8');
		}

		const jsonData = JSON.stringify(vercelDefaults, null, 2);

		const path = join($home, 'vercel.json');
		await writeFile(path, jsonData, 'utf-8');
		// await writeFile(vercelConfigPath, jsonData, 'utf-8');
		console.log('Build completed successfully.');
	} catch (err) {
		console.error('Build failed:', err);
	}
}

async function runServer() {
	const server = await createServer(config);
	await server.listen();

	server.printUrls();
	server.bindCLIShortcuts({ print: true });
}

// If build mode
if (isBuild) {
	buildProject();
} else {
	runServer();
}
