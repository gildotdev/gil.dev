import assert from 'node:assert/strict';
import test from 'node:test';
import { marked } from 'marked';
import {
  extractFirstImage,
  generateDescription,
  truncateHTML,
} from '../src/lib/utils.ts';

// Run with --no-experimental-require-module to match Lambda's default.
// Importing these utilities alone reproduced the jsdom 30 production crash.
test('renders post metadata with Lambda module loading', () => {
  const html = marked.parse('A **garden** &amp; a note.\n\n![Photo](https://example.com/photo.jpg)');
  assert.equal(extractFirstImage(html), 'https://example.com/photo.jpg');
  assert.equal(generateDescription(html), 'A garden & a note.');
  assert.equal(extractFirstImage('<img src="/relative.jpg">'), null);
  assert.equal(generateDescription('<p>One two three four</p>', 10), 'One two…');
});

test('post previews retain the first media and link to the full post', () => {
  const html = '<p>Hello</p><img src="https://example.com/one.jpg"><video src="two.mp4"></video>';
  const preview = truncateHTML(html, '2026/09/example');
  assert.match(preview, /<p>Hello<\/p>/);
  assert.match(preview, /one\.jpg/);
  assert.doesNotMatch(preview, /<video/);
  assert.match(preview, /href="\/posts\/2026\/09\/example"/);
  assert.match(preview, /More\.\.\./);
  assert.equal(truncateHTML('<p>Text only</p>', 'example'), '<p>Text only</p>');
});
