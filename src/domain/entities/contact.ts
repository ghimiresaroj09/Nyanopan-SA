/** Contact-us inquiries — created by the storefront form, triaged here. */

export type ContactMessageStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export const CONTACT_STATUSES: Array<{ value: ContactMessageStatus; label: string }> = [
  { value: 'NEW', label: 'New' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface ContactMessageUpdate {
  status?: ContactMessageStatus;
  admin_notes?: string;
}

export interface ContactMessageFilters {
  status?: ContactMessageStatus;
}
