import xml from 'xml';
import { render } from 'svelte/server';
import Page from './../../lib/components/Page.svelte';
import {
	getPagesByFolder,
	getFileLabel,
	processMarkdownFiles,
	loadCache
} from '../../lib/utilities';

export const prerender = true;

export async function GET({}) {
	/*
    It's wasteful to load everything here, but it should only run
    once at buildtime, so it's not a significant issue.
  */
	const initialCache = await loadCache($home[0]);

	const { folder: website } = await processMarkdownFiles(initialCache);

	const allPages = getPagesByFolder(website, '/');

	const sortedPages = allPages.filter((page) => page.hasOwnProperty('date'));

	const site_title = {
		title: website._.title || 'Untitled'
	};

	const feed = [];

	feed.push({
		_attr: {
			xmlns: 'http://www.w3.org/2005/Atom'
		}
	});

	feed.push(site_title);

	if (website._.domain)
		feed.push(
			{
				link: {
					_attr: {
						rel: 'self',
						href: `${website._.domain}/feed`
					}
				}
			},
			{
				id: 'https://littlefair.ca/feed'
			}
		);

	if (website._.author)
		feed.push(
			{
				author: {
					name: 'Sam Littlefair'
				}
			},
			{ rights: `Copyright (c) ${new Date().getFullYear()} Sam Littlefair` }
		);

	feed.push(
		...sortedPages.map((page) => {
			const url = website._.domain ? website._.domain + page.url : 'undefined';
			const entry = [
				{
					title: getFileLabel(page)
				},
				{
					link: {
						_attr: {
							rel: 'alternate',
							href: url
						}
					}
				},
				{ id: url },
				{ updated: page.date }
			];

			if (page.description) {
				entry.push({
					summary: page.description
				});
			}

			if (page.author) {
				entry.push({
					author: {
						name: page.author
					}
				});
			}

			entry.push({
				content: [
					{ _attr: { type: 'html' } },
					render(Page, { props: { page, level: 0, format: 'rss' } }).html
				]
			});

			return {
				entry
			};
		})
	);

	const headers = {
		'Cache-Control': 'max-age=0, s-maxage=3600',
		'Content-Type': 'text/xml'
	};

	const response = new Response(`<?xml version="1.0" encoding="utf-8"?>` + xml({ feed }, true), {
		headers
	});
	return response;
}
