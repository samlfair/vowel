#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import path from 'node:path';
import url from 'node:url';
import pc from 'picocolors';
import mri from 'mri';
import filterConsole from 'filter-console';
import process from 'process';
import readline from 'readline';
import logUpdate from 'log-update';

const args = mri(process.argv);

// Directory where the module is
const binURL = import.meta.url;
const binFilePath = url.fileURLToPath(binURL);
const binDirName = path.dirname(binFilePath);

// Directory where the command was called
const homeDir = process.cwd();

const spawnArgs = ['./server.js', '--directory', homeDir];
if (args._.includes('build')) spawnArgs.push('--build');
if (args._.includes('publish')) {
	spawnArgs.push('--build')
	spawnArgs.push('--publish')
};

if (!args.verbose) {
	filterConsole(['jsconfig', 'vite', 'Vite', 'tsconfig', `--host`]);
	console.log(`\n\n`);
}

// Args: File to run, home directory,
const child = spawn('node', spawnArgs, {
	cwd: binDirName
});

let processedFiles = 0;
let foundFiles = 0;
const std = process.stdout;

child.stdout.on('data', (data) => {
	const message = data.toString();
	if (message.match('fileread')) {
		processedFiles++;
		logUpdate(pc.green(`    Files read: ${processedFiles}/${foundFiles}`));
	} else if (message.startsWith('filesfound')) {
		const count = Number(message.split(':').at(-1).slice(0, -1));
		foundFiles += count;
	} else if (message.startsWith('loaded')) {
		logUpdate(pc.green(`    Files read: ${foundFiles}/${foundFiles}`));
		console.log(`\n\n`);
		processedFiles = 0;
		foundFiles = 0;
	} else if(false) { // Toggle to true to reveal all console output
		console.log(message)
	} else if (message.match('http://localhost:')) {
		const url = message.match(/http:\/\/localhost:\S+/);
		console.log(
			pc.bgCyan(
				pc.bold(`

    Website: ${url}
`)
			)
		);
		console.log(`\n`);
	} else {
		console.log(pc.blue(data));
	}
});

child.stderr.on('data', (data) => {
	console.error(pc.red(data));
});

child.on('close', (code) => {
	console.log(`child process exited with code ${code}`);
});
