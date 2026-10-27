import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../constants/api';
import { fetchWithTimeout, BLOG_TIMEOUT_MS } from './http';
import type { BlogPost } from '../types/blog';

const CACHE_KEY = 'blog_posts';

// Last successful fetch, so the blog still opens offline
export async function getCachedBlogPosts(): Promise<BlogPost[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const res = await fetchWithTimeout(ENDPOINTS.blog, {}, BLOG_TIMEOUT_MS);
  if (!res.ok) throw new Error(`Blog API error: ${res.status}`);
  const posts: BlogPost[] = await res.json();
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(posts));
  return posts;
}

export const filterByCategory = (posts: BlogPost[], category: string): BlogPost[] =>
  category === 'all' ? posts : posts.filter((post) => post.category === category);
