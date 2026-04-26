import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'daterra:recent-searches-v1';
const MAX = 10;

export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export async function addRecentSearch(query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return;
  const list = await getRecentSearches();
  // remove duplicatas (case-insensitive) e move o termo pra topo
  const filtered = list.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
  filtered.unshift(trimmed);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtered.slice(0, MAX)));
}

export async function removeRecentSearch(query: string): Promise<void> {
  const list = await getRecentSearches();
  const filtered = list.filter((s) => s !== query);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
}

export async function clearRecentSearches(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
