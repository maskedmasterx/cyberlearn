import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { CartItem, Course } from '@shared/schema';

interface CartContextType {
  cartItems: (CartItem & { course: Course })[];
  sessionId: string;
  addToCart: (courseId: number) => Promise<void>;
  removeFromCart: (courseId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [sessionId] = useState(() => {
    // Generate a unique session ID for the cart
    const stored = localStorage.getItem('cartSessionId');
    if (stored) return stored;
    
    const newId = 'session_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('cartSessionId', newId);
    return newId;
  });

  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery<(CartItem & { course: Course })[]>({
    queryKey: ['/api/cart', sessionId],
    queryFn: () => apiRequest('GET', `/api/cart/${sessionId}`).then(res => res.json()),
  });

  const addToCartMutation = useMutation({
    mutationFn: (courseId: number) => 
      apiRequest('POST', '/api/cart', { sessionId, courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart', sessionId] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (courseId: number) => 
      apiRequest('DELETE', `/api/cart/${sessionId}/${courseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart', sessionId] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/cart/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart', sessionId] });
    },
  });

  const addToCart = async (courseId: number) => {
    await addToCartMutation.mutateAsync(courseId);
  };

  const removeFromCart = async (courseId: number) => {
    await removeFromCartMutation.mutateAsync(courseId);
  };

  const clearCart = async () => {
    await clearCartMutation.mutateAsync();
  };

  const value: CartContextType = {
    cartItems,
    sessionId,
    addToCart,
    removeFromCart,
    clearCart,
    isLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
