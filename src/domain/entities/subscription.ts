/** Newsletter subscriber — read-only in the admin (storefront creates them). */
export interface Subscription {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
  created_at: string;
}

export interface SubscriptionFilters {
  is_active?: boolean;
}
