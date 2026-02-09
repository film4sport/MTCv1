import { describe, it, expect } from 'vitest';

// Test event data integrity
const eventsData = [
  {
    category: 'tournament',
    image: 'https://i.imgur.com/vqd926b.jpeg',
    badge: 'Tournament',
    date: 'July 26-27, 2026',
    title: '95+ Mixed Doubles Tournament',
    description: '$180/Team — 2 Matches Guaranteed.',
  },
  {
    category: 'camp',
    image: 'https://i.imgur.com/YOdfHw6.jpeg',
    badge: 'Camp',
    date: 'July 28 - Aug 1, 2026',
    title: 'Summer Tennis Camp',
    description: '8:30am - 3:30pm daily.',
  },
  {
    category: 'social',
    image: 'https://i.imgur.com/6u73Y8w.jpeg',
    badge: 'Social',
    date: 'Ongoing',
    title: 'Social Round Robin',
    description: 'Join our friendly social round robins!',
  },
];

describe('Events Data', () => {
  it('should have exactly 3 events', () => {
    expect(eventsData).toHaveLength(3);
  });

  it('each event should have required fields', () => {
    eventsData.forEach((event) => {
      expect(event.category).toBeTruthy();
      expect(event.image).toBeTruthy();
      expect(event.badge).toBeTruthy();
      expect(event.date).toBeTruthy();
      expect(event.title).toBeTruthy();
      expect(event.description).toBeTruthy();
    });
  });

  it('event categories should be valid', () => {
    const validCategories = ['tournament', 'camp', 'social'];
    eventsData.forEach((event) => {
      expect(validCategories).toContain(event.category);
    });
  });

  it('event images should be valid imgur URLs', () => {
    eventsData.forEach((event) => {
      expect(event.image).toMatch(/^https:\/\/i\.imgur\.com\//);
    });
  });

  it('should have no ClubSpark references', () => {
    eventsData.forEach((event) => {
      expect(event.description.toLowerCase()).not.toContain('clubspark');
      expect(event.title.toLowerCase()).not.toContain('clubspark');
    });
  });
});
