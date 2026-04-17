export type BlogCategory =
  | 'academics'
  | 'campus-life'
  | 'pittsburgh'
  | 'advice'
  | string;

export interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  date: string;
  category: BlogCategory;
  image: string;
  content: string;
}
