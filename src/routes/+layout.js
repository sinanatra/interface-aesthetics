import { lessons, editions } from '$lib/content';

export const prerender = true;

export function load() {
	return { lessons: lessons(), editions: editions() };
}
