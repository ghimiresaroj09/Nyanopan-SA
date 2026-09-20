/**
 * Storefront Home page CMS — two singletons:
 *   - /api/v1/admin/homepage/             GET/PUT — section1{tag,image,title,
 *                                           description,quote},
 *                                           section2{tag,title,description,
 *                                           image,feature[{title,intro}]},
 *                                           section3{tag,title,image,description}
 *   - /api/v1/admin/homepage/collections/ GET/PUT — tag, title, description,
 *                                           collections[] (nested rows)
 * Images are Cloudinary URLs from /admin/images/upload/.
 */

export interface FeatureRow {
  title: string;
  intro: string;
}

export interface HomepageSection1 {
  tag: string;
  image: string;
  title: string;
  description: string;
  quote: string;
}

export interface HomepageSection2 {
  tag: string;
  title: string;
  description: string;
  image: string;
  feature: FeatureRow[];
}

export interface HomepageSection3 {
  tag: string;
  title: string;
  image: string;
  description: string;
}

export interface HomepageData {
  section1: HomepageSection1;
  section2: HomepageSection2;
  section3: HomepageSection3;
}

export interface CollectionRow {
  id?: string;
  name: string;
  intro: string;
  /** Internal link path, e.g. /inside, /outdoor. */
  link: string;
  image: string;
  sort_order: number;
  is_active: boolean;
}

export interface HomepageCollectionsData {
  tag: string;
  title: string;
  description: string;
  collections: CollectionRow[];
}
