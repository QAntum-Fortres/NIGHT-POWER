// [PURIFIED_BY_AETERNA: c851d54f-e9e6-4055-af33-0a2638c5c5f6]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 08ce2b52-ac96-40a1-bc18-2ab6dfe9a4fa]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: a2ef5fd3-a549-4f01-9bf2-7e98ab49163e]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: a2ef5fd3-a549-4f01-9bf2-7e98ab49163e]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 8b087892-8d52-4b82-b697-5704d3b67527]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 3b32dd2a-91fa-4812-9d0f-466256524b18]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 3b32dd2a-91fa-4812-9d0f-466256524b18]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: b20e18f7-9ecb-4774-b0b4-f3ea0433392b]
// Suggestion: Review and entrench stable logic.
/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM IMMUTABLE STATE HELPERS                                              ║
 * ║   "Type-safe immutable state patterns"                                        ║
 * ║                                                                               ║
 * ║   TODO B #6 - Immutable State                                                 ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// DEEP READONLY TYPE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Deep readonly - прави всички nested properties readonly
 */
export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
    ? T
    : T extends object
      ? DeepReadonlyObject<T>
      : T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// IMMUTABLE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Deep freeze - runtime immutability
 */
export function deepFreeze<T>(obj: T): DeepReadonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj as DeepReadonly<T>;
  }

  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as any)[prop];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });

  return obj as DeepReadonly<T>;
}

/**
 * Deep clone - създава mutable копие
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Map) {
    return new Map(
      Array.from(obj.entries()).map(([k, v]) => [deepClone(k), deepClone(v)])
    ) as unknown as T;
  }

  if (obj instanceof Set) {
    return new Set(Array.from(obj).map((v) => deepClone(v))) as unknown as T;
  }

  const cloned: any = {};
  for (const key of Object.keys(obj)) {
    cloned[key] = deepClone((obj as any)[key]);
  }

  return cloned;
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMMUTABLE UPDATE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Type-safe shallow merge
 */
export function merge<T extends object>(base: T, updates: Partial<T>): T {
  return { ...base, ...updates };
}

/**
 * Update nested property immutably
 */
export function setIn<T extends object, K extends keyof T>(obj: T, key: K, value: T[K]): T {
  return { ...obj, [key]: value };
}

/**
 * Update deep nested property with path
 */
export function setPath<T>(obj: T, path: (string | number)[], value: unknown): T {
  if (path.length === 0) {
    return value as T;
  }

  const [head, ...tail] = path;
  const current = (obj as any)?.[head];

  if (Array.isArray(obj)) {
    const result = [...obj];
    result[head as number] = tail.length === 0 ? value : setPath(current, tail, value);
    return result as unknown as T;
  }

  return {
    ...obj,
    [head]: tail.length === 0 ? value : setPath(current, tail, value),
  };
}

/**
 * Get nested property by path
 */
export function getPath<T>(obj: T, path: (string | number)[]): unknown {
  return path.reduce((acc: any, key) => acc?.[key], obj);
}

/**
 * Remove property immutably
 */
export function removeKey<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const { [key]: _, ...rest } = obj;
  return rest;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARRAY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const ImmutableArray = {
  /**
   * Push item to array (returns new array)
   */
  push<T>(arr: readonly T[], item: T): T[] {
    return [...arr, item];
  },

  /**
   * Remove item at index
   */
  removeAt<T>(arr: readonly T[], index: number): T[] {
    return [...arr.slice(0, index), ...arr.slice(index + 1)];
  },

  /**
   * Remove first matching item
   */
  remove<T>(arr: readonly T[], predicate: (item: T) => boolean): T[] {
    const index = arr.findIndex(predicate);
    return index >= 0 ? ImmutableArray.removeAt(arr, index) : [...arr];
  },

  /**
   * Update item at index
   */
  updateAt<T>(arr: readonly T[], index: number, updater: (item: T) => T): T[] {
    return arr.map((item, i) => (i === index ? updater(item) : item));
  },

  /**
   * Insert item at index
   */
  insertAt<T>(arr: readonly T[], index: number, item: T): T[] {
    return [...arr.slice(0, index), item, ...arr.slice(index)];
  },

  /**
   * Move item from one index to another
   */
  move<T>(arr: readonly T[], fromIndex: number, toIndex: number): T[] {
    const result = [...arr];
    const [item] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, item);
    return result;
  },

  /**
   * Replace all matching items
   */
  replaceWhere<T>(arr: readonly T[], predicate: (item: T) => boolean, newItem: T): T[] {
    return arr.map((item) => (predicate(item) ? newItem : item));
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAP HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const ImmutableMap = {
  /**
   * Set key in map (returns new map)
   */
  set<K, V>(map: ReadonlyMap<K, V>, key: K, value: V): Map<K, V> {
    return new Map(map).set(key, value);
  },

  /**
   * Delete key from map
   */
  delete<K, V>(map: ReadonlyMap<K, V>, key: K): Map<K, V> {
    const result = new Map(map);
    result.delete(key);
    return result;
  },

  /**
   * Merge two maps
   */
  merge<K, V>(map1: ReadonlyMap<K, V>, map2: ReadonlyMap<K, V>): Map<K, V> {
    return new Map([...map1, ...map2]);
  },

  /**
   * Update value in map
   */
  update<K, V>(map: ReadonlyMap<K, V>, key: K, updater: (value: V) => V): Map<K, V> {
    const value = map.get(key);
    if (value === undefined) return new Map(map);
    return new Map(map).set(key, updater(value));
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SET HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const ImmutableSet = {
  /**
   * Add item to set
   */
  add<T>(set: ReadonlySet<T>, item: T): Set<T> {
    return new Set(set).add(item);
  },

  /**
   * Delete item from set
   */
  delete<T>(set: ReadonlySet<T>, item: T): Set<T> {
    const result = new Set(set);
    result.delete(item);
    return result;
  },

  /**
   * Union of sets
   */
  union<T>(set1: ReadonlySet<T>, set2: ReadonlySet<T>): Set<T> {
    return new Set([...set1, ...set2]);
  },

  /**
   * Intersection of sets
   */
  intersection<T>(set1: ReadonlySet<T>, set2: ReadonlySet<T>): Set<T> {
    return new Set([...set1].filter((x) => set2.has(x)));
  },

  /**
   * Difference of sets (set1 - set2)
   */
  difference<T>(set1: ReadonlySet<T>, set2: ReadonlySet<T>): Set<T> {
    return new Set([...set1].filter((x) => !set2.has(x)));
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// IMMUTABLE STATE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Immutable state container with history
 */
export class ImmutableState<T extends object> {
  private _state: DeepReadonly<T>;
  private _history: DeepReadonly<T>[] = [];
  private _maxHistory: number;
  private _listeners: Set<(state: DeepReadonly<T>) => void> = new Set();

  constructor(initialState: T, maxHistory: number = 50) {
    this._state = deepFreeze(deepClone(initialState));
    this._maxHistory = maxHistory;
  }

  /**
   * Get current state
   */
  get state(): DeepReadonly<T> {
    return this._state;
  }

  /**
   * Update state with partial updates
   */
  update(updates: Partial<T>): void {
    this.saveHistory();
    const newState = merge(this._state as T, updates);
    this._state = deepFreeze(newState);
    this.notify();
  }

  /**
   * Set specific path
   */
  setPath(path: (string | number)[], value: unknown): void {
    this.saveHistory();
    const newState = setPath(this._state as T, path, value);
    this._state = deepFreeze(newState);
    this.notify();
  }

  /**
   * Reset to initial or specific state
   */
  reset(state: T): void {
    this.saveHistory();
    this._state = deepFreeze(deepClone(state));
    this.notify();
  }

  /**
   * Undo last change
   */
  undo(): boolean {
    if (this._history.length === 0) return false;
    this._state = this._history.pop()!;
    this.notify();
    return true;
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: (state: DeepReadonly<T>) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Get mutable clone
   */
  mutableClone(): T {
    return deepClone(this._state as T);
  }

  private saveHistory(): void {
    this._history.push(this._state);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }
  }

  private notify(): void {
    for (const listener of this._listeners) {
      listener(this._state);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const createImmutableState = <T extends object>(
  initialState: T,
  maxHistory?: number
): ImmutableState<T> => {
  return new ImmutableState(initialState, maxHistory);
};

export default {
  deepFreeze,
  deepClone,
  merge,
  setIn,
  setPath,
  getPath,
  removeKey,
  Array: ImmutableArray,
  Map: ImmutableMap,
  Set: ImmutableSet,
  State: ImmutableState,
  createState: createImmutableState,
};
