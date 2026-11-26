export interface FaqCategory {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface FaqCategoryInput {
  name: string;
}

export interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export interface FaqInput {
  category: string;
  question: string;
  answer: string;
}
