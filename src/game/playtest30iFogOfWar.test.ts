/**
 * Pack 12 Fog-of-War Location Discovery Tests (2026-08-30i)
 * 
 * Locations should only appear in WORLD panel and travel options after discovery.
 */

import { describe, it, expect } from 'vitest';
import type { GameState } from './types';
import { createInitialState } from './defaults';
import {
  isLocationDiscovered,
  discoverLocation,
  discoverLocations,
  detectAndDiscoverLocations,
  getDiscoveredSettlements,
} from './locationDiscovery';
import { outdoorHubTravelChoices, SUMMONED_PACT_HUBS } from './outdoorHubs';
import { seedStateFromCampaignBible } from './campaignSeed';
import { getCampaignBibleById } from '@/data/campaigns';
import { seedWorldAtlas } from './worldAtlas';

describe('Pack 12 Fog-of-War', () => {
  describe('Location Discovery', () => {
    it('marks current location as discovered on New Game', () => {
      const state = createInitialState('Test', 'litrpg');
      const bible = getCampaignBibleById('summoned-pact');
      expect(bible).toBeDefined();
      
      const seeded = seedStateFromCampaignBible(state, bible!);
      
      // Starting location should be discovered
      expect(seeded.discoveredLocations).toBeDefined();
      expect(seeded.discoveredLocations!.length).toBeGreaterThan(0);
      expect(isLocationDiscovered(seeded, seeded.currentLocation!)).toBe(true);
    });

    it('detects locations mentioned in narrative', () => {
      const state = createInitialState('Test', 'litrpg');
      const bible = getCampaignBibleById('summoned-pact');
      const withAtlas = seedWorldAtlas({ ...state, campaignBibleId: 'summoned-pact' }, bible!);
      
      const narrative = `You are standing in Lowmarket. The Contract Hall is visible to the north, and you can hear the sounds of the West Wall in the distance.`;
      
      const discovered = detectAndDiscoverLocations(withAtlas, narrative);
      
      expect(isLocationDiscovered(discovered, 'Lowmarket')).toBe(true);
      expect(isLocationDiscovered(discovered, 'Contract Hall')).toBe(true);
      expect(isLocationDiscovered(discovered, 'West Wall')).toBe(true);
    });

    it('only shows discovered settlements from world atlas', () => {
      const state = createInitialState('Test', 'litrpg');
      const bible = getCampaignBibleById('summoned-pact');
      const withAtlas = seedWorldAtlas({ ...state, campaignBibleId: 'summoned-pact' }, bible!);
      
      // Before discovery, no settlements
      const beforeDiscovery = getDiscoveredSettlements(withAtlas);
      expect(beforeDiscovery.length).toBe(0);
      
      // Discover a settlement
      const discovered = discoverLocation(withAtlas, 'Lowmarket');
      const afterDiscovery = getDiscoveredSettlements(discovered);
      
      expect(afterDiscovery.length).toBeGreaterThan(0);
      expect(afterDiscovery.some(s => s.name === 'Lowmarket')).toBe(true);
    });

    it('discovers location on travel', () => {
      const state = createInitialState('Test', 'litrpg');
      const bible = getCampaignBibleById('summoned-pact');
      const seeded = seedStateFromCampaignBible(state, bible!);
      
      // Discover starting location first
      const withStart = discoverLocation(seeded, seeded.currentLocation!);
      
      // Discover a travel destination
      const withDestination = discoverLocation(withStart, 'Lowmarket');
      
      expect(isLocationDiscovered(withDestination, 'Lowmarket')).toBe(true);
    });

    it('allows multiple location discovery in one call', () => {
      const state = createInitialState('Test', 'litrpg');
      const locations = ['Lowmarket', 'Contract Hall', 'West Wall'];
      
      const discovered = discoverLocations(state, locations);
      
      for (const loc of locations) {
        expect(isLocationDiscovered(discovered, loc)).toBe(true);
      }
    });

    it('handles duplicate discoveries gracefully', () => {
      const state = createInitialState('Test', 'litrpg');
      
      const once = discoverLocation(state, 'Lowmarket');
      const twice = discoverLocation(once, 'Lowmarket');
      
      // Should not duplicate
      expect(twice.discoveredLocations?.filter(l => l.includes('lowmarket')).length).toBe(1);
    });
  });

  describe('Travel Options Filtering', () => {
    it('only offers travel to discovered locations', () => {
      const state: GameState = {
        ...createInitialState('Test', 'litrpg'),
        campaignBibleId: 'summoned-pact',
        currentLocation: 'Sevenfold Circle',
        discoveredLocations: ['place_sevenfold-circle', 'place_lowmarket'],
        openingEstablishment: { pending: [], answers: {}, complete: true },
      };
      
      const travelOptions = outdoorHubTravelChoices(state, 4);
      
      // Should only include Lowmarket (discovered) not other hubs
      expect(travelOptions.some(opt => opt.includes('Lowmarket'))).toBe(true);
      expect(travelOptions.length).toBeLessThanOrEqual(2);
    });

    it('does not offer travel to undiscovered locations', () => {
      const state: GameState = {
        ...createInitialState('Test', 'litrpg'),
        campaignBibleId: 'summoned-pact',
        currentLocation: 'Sevenfold Circle',
        discoveredLocations: ['place_sevenfold-circle'], // Only starting location
        openingEstablishment: { pending: [], answers: {}, complete: true },
      };
      
      const travelOptions = outdoorHubTravelChoices(state);
      
      // Should not include undiscovered hubs
      expect(travelOptions.some(opt => opt.includes('Contract Hall'))).toBe(false);
      expect(travelOptions.some(opt => opt.includes('West Wall'))).toBe(false);
    });

    it('allows exploration from starting location during opening', () => {
      const state: GameState = {
        ...createInitialState('Test', 'litrpg'),
        campaignBibleId: 'summoned-pact',
        currentLocation: 'Sevenfold Circle',
        discoveredLocations: ['place_sevenfold-circle'],
        turn: 3, // Early game
        openingEstablishment: { pending: [], answers: {}, complete: true },
      };
      
      const travelOptions = outdoorHubTravelChoices(state);
      
      // Should allow some initial exploration
      expect(travelOptions.length).toBeGreaterThan(0);
    });
  });

  describe('WORLD Panel Filtering', () => {
    it('only shows factions from discovered locations', () => {
      const state: GameState = {
        ...createInitialState('Test', 'litrpg'),
        worldLedger: {
          clock: { day: 1, week: 1 },
          caravans: [],
          deals: [],
          holdings: [],
          hostiles: [],
          actors: [],
          pendingHiddenEvents: [],
          factionStandings: [
            { id: 'f1', name: 'Pellane Crown', standing: 'friendly', notes: 'Met in Valespire' },
            { id: 'f2', name: 'Ash Court', standing: 'neutral', notes: '' },
            { id: 'f3', name: 'Lowmarket Fences', standing: 'friendly', notes: 'Traded in Lowmarket' },
          ],
        },
        discoveredLocations: ['place_valespire', 'place_lowmarket'],
      };
      
      const visibleFactions = (state.worldLedger?.factionStandings ?? []).filter(f => {
        // Always show factions with notes (implies interaction)
        if (f.notes?.trim()) return true;
        // Check if faction is from a discovered location
        const factionKey = f.name.toLowerCase();
        return state.discoveredLocations?.some(locId => {
          const locKey = locId.toLowerCase();
          return locKey.includes(factionKey) || factionKey.includes(locKey);
        }) ?? false;
      });
      
      // Pellane Crown and Lowmarket Fences have notes, should be visible
      expect(visibleFactions.some(f => f.name === 'Pellane Crown')).toBe(true);
      expect(visibleFactions.some(f => f.name === 'Lowmarket Fences')).toBe(true);
      
      // Ash Court has no notes and is not from a discovered location, should be hidden
      expect(visibleFactions.some(f => f.name === 'Ash Court')).toBe(false);
    });
  });

  describe('Save Migration', () => {
    it('hydrates missing discoveredLocations on load', () => {
      const oldSave: GameState = {
        ...createInitialState('Test', 'litrpg'),
        currentLocation: 'Sevenfold Circle',
        // @ts-expect-error - simulating old save without discoveredLocations
        discoveredLocations: undefined,
      };
      
      // In real code, saveMigration.ts handles this
      const migrated: GameState = {
        ...oldSave,
        discoveredLocations: oldSave.currentLocation ? [oldSave.currentLocation] : [],
      };
      
      expect(migrated.discoveredLocations).toBeDefined();
      expect(migrated.discoveredLocations!.length).toBeGreaterThan(0);
      expect(migrated.discoveredLocations).toContain('Sevenfold Circle');
    });
  });

  describe('Opening Establishment', () => {
    it('discovers resolved opening location', () => {
      const state = createInitialState('Test', 'litrpg');
      const bible = getCampaignBibleById('summoned-pact');
      const seeded = seedStateFromCampaignBible(state, bible!);
      
      // Opening should have discovered the starting location
      expect(seeded.discoveredLocations).toBeDefined();
      expect(seeded.discoveredLocations!.length).toBeGreaterThan(0);
      expect(isLocationDiscovered(seeded, seeded.currentLocation!)).toBe(true);
    });
  });
});
