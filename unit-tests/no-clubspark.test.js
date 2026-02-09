import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const componentsDir = join(__dirname, '..', 'app', '(landing)', 'components');
const pageFile = join(__dirname, '..', 'app', '(landing)', 'page.tsx');

describe('No ClubSpark Links', () => {
  it('page.tsx should have no ClubSpark references', () => {
    const content = readFileSync(pageFile, 'utf-8');
    expect(content.toLowerCase()).not.toContain('clubspark');
  });

  it('no component files should have ClubSpark links', () => {
    const files = readdirSync(componentsDir).filter((f) => f.endsWith('.tsx'));
    files.forEach((file) => {
      const content = readFileSync(join(componentsDir, file), 'utf-8');
      expect(content.toLowerCase()).not.toContain('clubspark.ca');
    });
  });

  it('landing.css should have no ClubSpark references', () => {
    const cssFile = join(__dirname, '..', 'app', '(landing)', 'styles', 'landing.css');
    const content = readFileSync(cssFile, 'utf-8');
    expect(content.toLowerCase()).not.toContain('clubspark');
  });
});
