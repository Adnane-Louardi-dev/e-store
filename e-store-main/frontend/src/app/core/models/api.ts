export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  errors: FieldViolation[];
}

export interface FieldViolation {
  field: string;
  message: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type Role = 'USER' | 'ADMIN';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: 'Bearer';
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  expiresAt: string;
}

export interface ProfileResponse {
  id: number;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
}

export interface UpdateProfileRequest {
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  profile: ProfileResponse | null;
}

export interface CategoryRequest {
  name: string;
  description?: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
}

export interface ProductRequest {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: CategoryResponse;
  quantityInStock: number;
}

export interface AdjustStockRequest {
  quantity: number;
}

export interface InventoryResponse {
  productId: number;
  productName: string;
  quantity: number;
}

export interface AddCartItemRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartItemResponse {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CartResponse {
  id: number;
  userId: number;
  items: CartItemResponse[];
  itemCount: number;
  total: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderResponse {
  id: number;
  userId: number;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItemResponse[];
}

export interface UpdateOrderItemRequest {
  quantity: number;
}

export interface ReviewRequest {
  productId: number;
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  productId: number;
  userId: number;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}
