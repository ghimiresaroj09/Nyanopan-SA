/**
 * Composition root: API-backed adapters for the live backend.
 */
import type { Repositories } from '../domain/repositories';
import {
  ApiAnalyticsRepository,
  ApiAttributeRepository,
  ApiCategoryRepository,
  ApiConfigurationRepository,
  ApiHomepageCollectionsRepository,
  ApiHomepageRepository,
  ApiImageUploadRepository,
  ApiMakersRepository,
  ApiModelRepository,
  ApiPolicyRepository,
  ApiProductRepository,
  ApiContactMessageRepository,
  ApiDeliveryLocationRepository,
  ApiOrderRepository,
  ApiStoryRepository,
  ApiSubscriptionRepository,
  ApiSustainabilityRepository,
} from './api/repositories';

export const repositories: Repositories = {
  categories: new ApiCategoryRepository(),
  attributes: new ApiAttributeRepository(),
  models: new ApiModelRepository(),
  products: new ApiProductRepository(),
  configuration: new ApiConfigurationRepository(),
  policies: new ApiPolicyRepository(),
  analytics: new ApiAnalyticsRepository(),
  story: new ApiStoryRepository(),
  sustainability: new ApiSustainabilityRepository(),
  makers: new ApiMakersRepository(),
  imageUpload: new ApiImageUploadRepository(),
  homepage: new ApiHomepageRepository(),
  homepageCollections: new ApiHomepageCollectionsRepository(),
  subscriptions: new ApiSubscriptionRepository(),
  contactMessages: new ApiContactMessageRepository(),
  deliveryLocations: new ApiDeliveryLocationRepository(),
  orders: new ApiOrderRepository(),
};
