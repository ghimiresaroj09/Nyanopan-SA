/** Policy documents (GET/POST/PATCH /api/v1/admin/policies/). */

export type PolicyType =
  | 'TERMS_CONDITIONS'
  | 'PRIVACY_POLICY'
  | 'EXCHANGES_RETURNS'
  | 'SHIPPING';

export const POLICY_TABS: Array<{ type: PolicyType; label: string }> = [
  { type: 'TERMS_CONDITIONS', label: 'Terms and Conditions' },
  { type: 'PRIVACY_POLICY', label: 'Privacy Policy' },
  { type: 'EXCHANGES_RETURNS', label: 'Exchanges & Returns' },
  { type: 'SHIPPING', label: 'Shipping' },
];

export interface Policy {
  id: string;
  type: PolicyType;
  title: string;
  content: string; // sanitized HTML
  is_active: boolean;
  updated_at: string;
}

export interface PolicyInput {
  type: PolicyType;
  title: string;
  content: string;
  is_active?: boolean;
}
