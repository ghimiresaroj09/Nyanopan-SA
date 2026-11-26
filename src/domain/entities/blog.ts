export interface BlogCategory {
  id: string;
  name: string;
  blogs_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogCategoryInput {
  name: string;
}

export interface Blog {
  id: string;
  category: string;
  category_name: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  image_title: string;
  image_alt: string;
  image_caption: string;
  tags: string;
  is_featured: boolean;
  is_published: boolean;
  views: number;
  published_at: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_url: string;
  og_image: string;
  meta_robots: string;
  created_at: string;
  updated_at: string;
}

export type BlogInput = Omit<Blog, 'id' | 'category_name' | 'views' | 'created_at' | 'updated_at'>;
