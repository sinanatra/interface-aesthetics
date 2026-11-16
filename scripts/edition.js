import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dir, list, titleOf, template, fail } from './lib.js';

function currentYear() {
	const now = new Date();
	const start = now.getFullYear() - (now.getMonth() < 8 ? 1 : 0);
	return `${start}-${String(start + 1).slice(-2)}`;
}

const year = process.argv[2] ?? currentYear();
if (!/^\d{4}-\d{2}$/.test(year)) fail(`Expected a year like 2026-27, got "${year}"`);

const root = `/editions/${year}`;
const archive = new URL(`${year}/`, dir('editions'));
if (existsSync(archive)) fail(`content/editions/${year}/ already exists: ${year} is already archived`);

const relink = (md) => md.replace(/\]\(\/(lessons\/|case-study\)|readings\)|resources\))/g, `](${root}/$1`);
const read = (url) => readFileSync(url, 'utf8');

mkdirSync(new URL('lessons/', archive), { recursive: true });
const lessons = list('lessons');
for (const f of lessons) {
	writeFileSync(new URL(`lessons/${f}`, archive), relink(read(new URL(f, dir('lessons')))));
}
for (const f of ['case-study.md', 'readings.md', 'resources.md']) {
	writeFileSync(new URL(f, archive), relink(read(new URL(`../content/${f}`, import.meta.url))));
}

const links = lessons.map((f) => {
	const number = f.match(/^(\d+)-/)?.[1];
	const title = titleOf(new URL(f, dir('lessons')));
	return { label: `${number ? `${number} — ` : ''}${title}`, href: `${root}/lessons/${f.slice(0, -3)}` };
});
const section = [
	'## Archive',
	'',
	...links.map((l) => `- [${l.label}](${l.href})`),
	`- [Case Study](${root}/case-study)`,
	`- [Readings](${root}/readings)`,
	// `- [Resources](${root}/resources)`
].join('\n');

const page = new URL(`${year}.md`, dir('editions'));
const text = existsSync(page)
	? relink(read(page))
	: template('edition').replace('{title}', year.replace('-', '–'));
writeFileSync(page, `${text.trimEnd()}\n\n${section}\n`);

console.log(`Archived ${lessons.length} lessons, readings and resources to content/editions/${year}/`);
