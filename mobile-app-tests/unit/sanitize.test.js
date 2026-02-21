import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load utils.js to get sanitizeHTML
const utilsCode = readFileSync(resolve(__dirname, '../js/utils.js'), 'utf-8');

describe('sanitizeHTML', () => {
  let sanitizeHTML;

  beforeEach(() => {
    // Execute utils.js code to define sanitizeHTML
    const fn = new Function(utilsCode + '\nreturn sanitizeHTML;');
    sanitizeHTML = fn();
  });

  it('escapes < and > characters', () => {
    expect(sanitizeHTML('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('escapes & character', () => {
    expect(sanitizeHTML('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes double quotes', () => {
    expect(sanitizeHTML('He said "hello"')).toBe('He said &quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(sanitizeHTML("It's fine")).toBe('It&#039;s fine');
  });

  it('returns empty string for null', () => {
    expect(sanitizeHTML(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(sanitizeHTML(undefined)).toBe('');
  });

  it('returns empty string for numbers', () => {
    expect(sanitizeHTML(42)).toBe('');
  });

  it('handles empty string', () => {
    expect(sanitizeHTML('')).toBe('');
  });

  it('handles mixed dangerous content', () => {
    expect(sanitizeHTML('<img src="x" onerror="alert(1)">')).toBe(
      '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;'
    );
  });
});
