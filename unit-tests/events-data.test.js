import { describe, it, expect } from 'vitest';

// Test event data integrity
const CDN = 'https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images';

const eventsData = [
  {
    category: 'tournament',
    image: `${CDN}/event-mixed-doubles-tournament.jpeg`,
    badge: 'Tournament',
    date: 'July 26-27, 2026',
    title: '95+ Mixed Doubles Tournament',
    description: '$180/Team — 2 Matches Guaranteed.',
  },
  {
    category: 'camp',
    image: `${CDN}/event-summer-camp.jpeg`,
    badge: 'Camp',
    date: 'TBC',
    title: 'Summer Tennis Camp',
    description: 'Dates coming soon.',
  },
  {
    category: 'social',
    image: `${CDN}/event-social-round-robin.jpeg`,
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

  it('event images should be valid CDN URLs', () => {
    eventsData.forEach((event) => {
      expect(event.image).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/gh\/film4sport\//);
    });
  });

  it('should have no ClubSpark references', () => {
    eventsData.forEach((event) => {
      expect(event.description.toLowerCase()).not.toContain('clubspark');
      expect(event.title.toLowerCase()).not.toContain('clubspark');
    });
  });
});
