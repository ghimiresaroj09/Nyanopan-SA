/**
 * "Our Story & Sustainability" CMS page — three tabs backed by singleton
 * endpoints whose payloads NEST the editable sections:
 *
 *   - /api/v1/admin/our-story/          GET/PUT — title, description,
 *                                         section1, section2, section3{title, subsections[]}
 *   - /api/v1/admin/our-sustainability/ GET/PUT — title, description, sections[]
 *   - /api/v1/admin/our-makers/         GET/PATCH — head block
 *   - /api/v1/admin/team-members/       CRUD (multipart, binary image part)
 *
 * Subsection/section rows are sent WITHOUT ids — the backend assigns them.
 */

/** Simple image+text block (story section1 / section2). */
export interface SimpleSection {
  title: string;
  description: string;
  /** Cloudinary URL — set via /admin/images/upload/, never pasted. */
  image: string;
}

/** Row in section3.subsections or sustainability.sections. */
export interface SubsectionRow {
  id?: string;
  title: string;
  description: string;
  image: string;
  sort_order: number;
  is_active: boolean;
}

export interface StoryData {
  title: string;
  description: string;
  section1: SimpleSection;
  section2: SimpleSection;
  section3: { title: string; subsections: SubsectionRow[] };
}

export interface SustainabilityData {
  title: string;
  description: string;
  sections: SubsectionRow[];
}

/** Our Makers head block (PATCH /admin/our-makers/). */
export interface ContentPage {
  title: string;
  description: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  intro: string;
  image: string;
  sort_order: number;
  is_active: boolean;
}

export interface TeamMemberInput {
  name: string;
  role: string;
  intro: string;
  /** Photo — Cloudinary URL set via /admin/images/upload/ ('' clears it). */
  image?: string | null;
  sort_order?: number;
  is_active?: boolean;
}
