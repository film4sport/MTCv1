import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const utilsCode = readFileSync(resolve(__dirname, '../js/utils.js'), 'utf-8');
const configCode = readFileSync(resolve(__dirname, '../js/config.js'), 'utf-8');

describe('MTC.config', () => {
  let MTC;

  beforeEach(() => {
    // Load utils (defines MTC) then config (defines MTC.config)
    const fn = new Function(utilsCode + '\n' + configCode + '\nreturn MTC;');
    MTC = fn();
  });

  it('courts has 4 entries', () => {
    expect(MTC.config.courts).toHaveLength(4);
  });

  it('each court has id, name, and floodlight', () => {
    MTC.config.courts.forEach(court => {
      expect(court).toHaveProperty('id');
      expect(court).toHaveProperty('name');
      expect(court).toHaveProperty('floodlight');
    });
  });

  it('fees has correct values', () => {
    expect(MTC.config.fees.booking).toBe(0);
    expect(MTC.config.fees.guest).toBe(10);
    expect(MTC.config.fees.tabWarning).toBe(20);
    expect(MTC.config.fees.tabBlock).toBe(30);
    expect(MTC.config.fees.cancelWindowHours).toBe(24);
  });

  it('credentials has 3 entries', () => {
    expect(Object.keys(MTC.config.credentials)).toHaveLength(3);
    expect(MTC.config.credentials).toHaveProperty('member@mtc.ca');
    expect(MTC.config.credentials).toHaveProperty('coach@mtc.ca');
    expect(MTC.config.credentials).toHaveProperty('admin@mtc.ca');
  });

  it('all config keys present', () => {
    expect(MTC.config).toHaveProperty('courts');
    expect(MTC.config).toHaveProperty('timeSlots');
    expect(MTC.config).toHaveProperty('courtHours');
    expect(MTC.config).toHaveProperty('eventTypes');
    expect(MTC.config).toHaveProperty('headCoach');
    expect(MTC.config).toHaveProperty('fees');
    expect(MTC.config).toHaveProperty('credentials');
    expect(MTC.config).toHaveProperty('club');
    expect(MTC.config).toHaveProperty('guestAllowedScreens');
  });

  it('timeSlots has 13 entries', () => {
    expect(MTC.config.timeSlots).toHaveLength(13);
    expect(MTC.config.timeSlots[0]).toBe('9:30');
  });
});
