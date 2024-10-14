import path from 'path';

export default function resolveHomeDirPath(filename, homeDir) {
	return path.normalize(path.join(homeDir, filename));
}
