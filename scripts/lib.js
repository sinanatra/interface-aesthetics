import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

export const dir = (name) => new URL(`../content/${name}/`, import.meta.url);
export const list = (name) => readdirSync(dir(name)).filter((f) => f.endsWith('.md')).sort();
export const titleOf = (file) => readFileSync(file, 'utf8').match(/^#\s+(.+)$/m)?.[1].trim() ?? '';
export const template = (name) => readFileSync(new URL(`templates/${name}.md`, import.meta.url), 'utf8');

export function fail(message) {
	console.error(message);
	process.exit(1);
}

export function create(folder, slug, text) {
	const file = new URL(`${slug}.md`, dir(folder));
	if (existsSync(file)) fail(`content/${folder}/${slug}.md already exists`);
	writeFileSync(file, text);
	console.log(`Created content/${folder}/${slug}.md`);
}
