import { beforeEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchBlogPosts, getCachedBlogPosts, filterByCategory } from '../blogService';
import type { BlogPost } from '../../types/blog';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories are hoisted, can't use import
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const post = (id: string, category = 'advice'): BlogPost => ({
  id, title: id, subtitle: '', author: '', date: '2026-01-01', category, image: '', content: '',
});
const mockFetch = (res: object) => { global.fetch = jest.fn(async () => res) as unknown as typeof fetch; };

beforeEach(async () => { await AsyncStorage.clear(); });

test('fetches posts and caches them for offline use', async () => {
  mockFetch({ ok: true, json: async () => [post('a')] });
  await expect(fetchBlogPosts()).resolves.toEqual([post('a')]);
  await expect(getCachedBlogPosts()).resolves.toEqual([post('a')]);
});

test('a failed fetch throws and keeps the last good cache', async () => {
  mockFetch({ ok: true, json: async () => [post('a')] });
  await fetchBlogPosts();
  mockFetch({ ok: false, status: 503 });
  await expect(fetchBlogPosts()).rejects.toThrow('503');
  await expect(getCachedBlogPosts()).resolves.toEqual([post('a')]);
});

test('empty or corrupt cache reads as null', async () => {
  await expect(getCachedBlogPosts()).resolves.toBeNull();
  await AsyncStorage.setItem('blog_posts', '{not json');
  await expect(getCachedBlogPosts()).resolves.toBeNull();
});

test('filters by category, "all" returns everything', () => {
  const posts = [post('a', 'advice'), post('b', 'pittsburgh')];
  expect(filterByCategory(posts, 'all')).toEqual(posts);
  expect(filterByCategory(posts, 'pittsburgh')).toEqual([post('b', 'pittsburgh')]);
});
