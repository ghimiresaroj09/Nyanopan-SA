export type CatalogStatus = 'active' | 'inactive';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Delivery URL of the category image. */
  image: string;
  status: CatalogStatus;
  createdAt: string;
}

export interface Attribute {
  id: string;
  name: string;
  /** Payload contract: { "name": "Color", "value": ["Grey", "Blue"] } */
  value: string[];
  createdAt: string;
}

/** A product model grouping in the catalog (backend: product-models). */
export interface Model {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: CatalogStatus;
  productCount: number;
  createdAt: string;
}

export type AttributeInput = Omit<Attribute, 'id' | 'createdAt'>;
export type ModelInput = Omit<Model, 'id' | 'slug' | 'productCount' | 'createdAt'>;
