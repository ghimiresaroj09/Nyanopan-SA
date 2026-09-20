/** Singleton site configuration (GET/PATCH /api/v1/admin/configuration/). */

export interface SocialLinks {
  facebook: string;
  instagram: string;
  tiktok: string;
  pinterest: string;
}

export interface SiteConfiguration {
  company_intro: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  map_url: string;
  social: SocialLinks;
}

export const EMPTY_CONFIGURATION: SiteConfiguration = {
  company_intro: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  map_url: '',
  social: { facebook: '', instagram: '', tiktok: '', pinterest: '' },
};
