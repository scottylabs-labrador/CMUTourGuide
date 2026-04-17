import postsData from '../data/blogPosts.json';
import type { BlogPost } from '../types/blog';

const posts = postsData as BlogPost[];

export const getAllBlogPosts = (): BlogPost[] => posts;

export const getBlogPostsByCategory = (category: string): BlogPost[] =>
  category === 'all'
    ? posts
    : posts.filter((post) => post.category === category);

export const getBlogPostById = (id: string): BlogPost | undefined =>
  posts.find((post) => post.id === id);
