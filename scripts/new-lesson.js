import { list, fail, create } from './lib.js';

const title = process.argv.slice(2).join(' ').trim();
if (!title) fail('Usage: npm run lesson -- "Lesson title"');

const last = Number(list('lessons').at(-1)?.match(/^(\d+)-/)?.[1] ?? 0);
const number = String(last + 1).padStart(2, '0');
const slug = title
	.toLowerCase()
	.normalize('NFD')
	.replace(/[̀-ͯ]/g, '')
	.replace(/[^a-z0-9]+/g, '-')
	.replace(/^-|-$/g, '');

create('lessons', `${number}-${slug}`, `# ${title}\n`);
