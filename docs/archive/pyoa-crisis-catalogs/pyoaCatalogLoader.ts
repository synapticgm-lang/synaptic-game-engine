/**
 * WS-5 Wave D: PYOA Crisis Catalog Loader
 * 
 * Loads and manages crisis catalogs for Pick-Your-Own-Adventure bibles:
 * - thornferry-road.json (6 crises)
 * - vesper-glass-cipher.json (6 crises)
 * - erebus-9.json (6 crises)
 * 
 * Each crisis has:
 * - Exclusive fact groups (mutex enforcement)
 * - Fork trees (branch selection)
 * - Delayed consequences (echo/return/reckoning)
 * - Ending gates (6 per bible)
 * 
 * Related:
 * - pyoaCrisisRegistry.ts - Crisis selection logic
 * - pyoaExclusiveFacts.ts - Mutex enforcement
 * - pyoaDelayedConsequences.ts - Consequence scheduling
 * - pyoaConvergence.ts - Branch merging
 */

import thornferryRoad from './data/pyoa/thornferry-road.json';
import vesperGlass from './data/pyoa/vesper-glass-cipher.json';
import erebus9 from './data/pyoa/erebus-9.json';

// ============================================================================
// CATALOG SCHEMA
// ============================================================================

export interface PyoaCrisis {
  id: string;
  title: string;
  window: {
    earliest: number;
    target: number;
    latest: number;
  };
  prerequisites: any;
  forks: any[];
}

export interface PyoaForkTree {
  crisisId: string;
  branches: {
    id: string;
    predicates: string[];
    consequences: string[];
    siblingLocks?: string[];
  }[];
  convergencePoints?: {
    atTurn: number;
    fromBranches: string[];
    mergedFacts: string[];
  }[];
}

export interface PyoaEnding {
  id: string;
  title: string;
  priority: number;
  requiresFacts?: {
    all?: string[];
    any?: string[];
    none?: string[];
  };
  requiresConsequences?: string[];
  requiresRelationships?: Record<string, number>;
  turnRange?: [number, number];
  epilogue: {
    title: string;
    narrative: string;
    mood: 'triumphant' | 'bittersweet' | 'tragic' | 'ambiguous';
  };
}

export interface PyoaCatalog {
  schemaVersion: number;
  bibleId: string;
  title: string;
  premise: string;
  
  exclusiveFactGroups: {
    id: string;
    mode: 'at-most-one' | 'exactly-one-after-crisis';
    ownerCrisisId?: string;
    members: string[];
    description: string;
  }[];
  
  crises: PyoaCrisis[];
  forkTrees: PyoaForkTree[];
  endings: PyoaEnding[];
}

// ============================================================================
// CATALOG REGISTRY
// ============================================================================

class PyoaCatalogRegistry {
  private catalogs: Map<string, PyoaCatalog> = new Map();
  private crisisByBible: Map<string, PyoaCrisis[]> = new Map();
  private endingsByBible: Map<string, PyoaEnding[]> = new Map();
  
  /**
   * Register a catalog
   */
  register(catalog: PyoaCatalog): void {
    this.catalogs.set(catalog.bibleId, catalog);
    this.crisisByBible.set(catalog.bibleId, catalog.crises);
    this.endingsByBible.set(catalog.bibleId, catalog.endings);
  }
  
  /**
   * Get catalog by bible ID
   */
  getCatalog(bibleId: string): PyoaCatalog | undefined {
    return this.catalogs.get(bibleId);
  }
  
  /**
   * Get crises for a bible
   */
  getCrises(bibleId: string): PyoaCrisis[] {
    return this.crisisByBible.get(bibleId) || [];
  }
  
  /**
   * Get endings for a bible
   */
  getEndings(bibleId: string): PyoaEnding[] {
    return this.endingsByBible.get(bibleId) || [];
  }
  
  /**
   * Get next eligible crisis
   */
  getNextCrisis(
    bibleId: string,
    activeFacts: string[],
    turnIndex: number,
    completedCrises: string[]
  ): PyoaCrisis | null {
    const crises = this.getCrises(bibleId);
    
    // Filter to eligible crises
    const eligible = crises.filter(crisis => {
      // Already completed
      if (completedCrises.includes(crisis.id)) {
        return false;
      }
      
      // Check turn window
      if (turnIndex < crisis.window.earliest) {
        return false;
      }
      
      // Check prerequisites (if any)
      if (crisis.prerequisites) {
        // Add prerequisite checking logic here if needed
      }
      
      return true;
    });
    
    // Return earliest by target turn
    eligible.sort((a, b) => a.window.target - b.window.target);
    return eligible[0] || null;
  }
  
  /**
   * Get eligible endings
   */
  getEligibleEndings(
    bibleId: string,
    activeFacts: string[],
    resolvedConsequences: string[],
    unresolvedConsequences: string[],
    relationships: Record<string, number>,
    turnIndex: number
  ): PyoaEnding[] {
    const endings = this.getEndings(bibleId);
    
    const eligible = endings.filter(ending => {
      // Check turn range if specified
      if (ending.turnRange) {
        const [minTurn, maxTurn] = ending.turnRange;
        if (turnIndex < minTurn || turnIndex > maxTurn) {
          return false;
        }
      }
      
      // Check required facts if specified
      if (ending.requiresFacts) {
        if (ending.requiresFacts.all) {
          const hasAll = ending.requiresFacts.all.every(fact => activeFacts.includes(fact));
          if (!hasAll) return false;
        }
        
        if (ending.requiresFacts.any) {
          const hasAny = ending.requiresFacts.any.some(fact => activeFacts.includes(fact));
          if (!hasAny) return false;
        }
        
        if (ending.requiresFacts.none) {
          const hasNone = !ending.requiresFacts.none.some(fact => activeFacts.includes(fact));
          if (!hasNone) return false;
        }
      }
      
      // Check relationships if specified
      if (ending.requiresRelationships) {
        for (const [npc, minValue] of Object.entries(ending.requiresRelationships)) {
          if ((relationships[npc] || 0) < minValue) {
            return false;
          }
        }
      }
      
      return true;
    });
    
    // Sort by priority (higher = prefer)
    eligible.sort((a, b) => b.priority - a.priority);
    return eligible;
  }
  
  /**
   * Get catalog statistics
   */
  getStats(): {
    totalCatalogs: number;
    totalCrises: number;
    totalEndings: number;
    byCatalog: Record<string, { crises: number; endings: number }>;
  } {
    const byCatalog: Record<string, { crises: number; endings: number }> = {};
    let totalCrises = 0;
    let totalEndings = 0;
    
    for (const [bibleId, catalog] of this.catalogs) {
      const crises = this.getCrises(bibleId);
      const endings = this.getEndings(bibleId);
      
      byCatalog[bibleId] = {
        crises: crises.length,
        endings: endings.length
      };
      
      totalCrises += crises.length;
      totalEndings += endings.length;
    }
    
    return {
      totalCatalogs: this.catalogs.size,
      totalCrises,
      totalEndings,
      byCatalog
    };
  }
}

// Global registry instance
const PYOA_REGISTRY = new PyoaCatalogRegistry();

// ============================================================================
// MODULE INITIALIZATION
// ============================================================================

/**
 * Initialize PYOA catalog registry
 */
export function initializePyoaCatalogs(): {
  loaded: number;
  stats: ReturnType<typeof PYOA_REGISTRY.getStats>;
} {
  // Register all catalogs
  PYOA_REGISTRY.register(thornferryRoad as unknown as PyoaCatalog);
  PYOA_REGISTRY.register(vesperGlass as unknown as PyoaCatalog);
  PYOA_REGISTRY.register(erebus9 as unknown as PyoaCatalog);
  
  return {
    loaded: 3,
    stats: PYOA_REGISTRY.getStats()
  };
}

/**
 * Get PYOA catalog registry
 */
export function getPyoaRegistry(): PyoaCatalogRegistry {
  return PYOA_REGISTRY;
}

// Auto-initialize on module load
const initResult = initializePyoaCatalogs();
console.log(`PYOA catalogs loaded: ${initResult.loaded}`, initResult.stats);
