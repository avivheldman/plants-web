// User type for authentication and profile
export interface User {
  _id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

// Post type for the feed
export interface Post {
  _id: string;
  userId: string;
  author?: User;
  text: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

// Comment type for post comments
export interface Comment {
  _id: string;
  postId: string;
  userId: string;
  author?: User;
  text: string;
  createdAt: string;
}

// Like type for tracking likes
export interface Like {
  _id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

// Auth response types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
