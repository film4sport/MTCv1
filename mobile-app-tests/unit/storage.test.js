import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load utils.js for MTC.storage
const utilsCode = readFileSync(resolve(__dirname, '../js/utils.js'), 'utf-8');

describe('MTC.storage', () => {
  let MTC;

  beforeEach(() => {
    localStorage.clear();
    // Execute utils.js — returns MTC namespace
    const fn = new Function(utilsCode + '\nreturn MTC;');
    MTC = fn();
  });

  it('get/set roundtrip for objects', () => {
    const obj = { name: 'Alex', age: 30 };
    MTC.storage.set('test-obj', obj);
    expect(MTC.storage.get('test-obj')).toEqual(obj);
  });

  it('get/set roundtrip for arrays', () => {
    const arr = [1, 'two', { three: 3 }];
    MTC.storage.set('test-arr', arr);
    expect(MTC.storage.get('test-arr')).toEqual(arr);
  });

  it('get/set roundtrip for strings', () => {
    MTC.storage.set('test-str', 'hello world');
    expect(MTC.storage.get('test-str')).toBe('hello world');
  });

  it('get/set roundtrip for numbers', () => {
    MTC.storage.set('test-num', 42);
    expect(MTC.storage.get('test-num')).toBe(42);
  });

  it('get returns fallback on corrupt JSON', () => {
    localStorage.setItem('corrupt', '{broken json!!!');
    expect(MTC.storage.get('corrupt', 'fallback')).toBe('fallback');
  });

  it('get returns null when no fallback and key missing', () => {
    expect(MTC.storage.get('nonexistent')).toBeNull();
  });

  it('get returns fallback when key missing', () => {
    expect(MTC.storage.get('nonexistent', [])).toEqual([]);
  });

  it('remove deletes key', () => {
    MTC.storage.set('to-delete', 'value');
    expect(MTC.storage.get('to-delete')).toBe('value');
    MTC.storage.remove('to-delete');
    expect(MTC.storage.get('to-delete')).toBeNull();
  });

  it('getString returns raw string', () => {
    localStorage.setItem('raw', 'not json');
    expect(MTC.storage.getString('raw')).toBe('not json');
  });

  it('getString returns fallback for missing key', () => {
    expect(MTC.storage.getString('missing', 'default')).toBe('default');
  });
});
