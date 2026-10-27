export type RoutePath =
  | '/'
  | '/ai'
  | '/marketplace'
  | '/services'
  | '/academy'
  | '/digital-products'
  | '/about'
  | '/contact'
  | '/privacy'
  | '/terms'
  | '/signin'
  | '/register'
  | '/forgot-password'
  | '/verify-email'
  | '/reset-password'
  | '/account'
  | '/management/products/new'
  | (string & {});

export interface EcosystemPillar {
  number: string;
  title: string;
  tagline: string;
  description: string;
  route: RoutePath;
  capabilities: string[];
}

export interface ServiceCategory {
  title: string;
  description: string;
  specialties: string[];
}

export interface AcademyTrack {
  title: string;
  summary: string;
  focus: string;
}

export interface MarketplaceCategory {
  title: string;
  description: string;
  scope: string;
}

export * from './digitalProduct';
