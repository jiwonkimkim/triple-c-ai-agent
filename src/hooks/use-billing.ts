'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SubscriptionData {
  plan: {
    id: string;
    name: string;
    description: string;
    features: string[];
    limits: Record<string, any>;
  };
  credits: number;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

interface CreditsData {
  balance: number;
  trialCredits: number;
  plan: string;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balance: number;
    description: string;
    createdAt: string;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Fetch subscription data
async function fetchSubscription(): Promise<SubscriptionData> {
  const response = await fetch('/api/billing/subscription');
  if (!response.ok) {
    throw new Error('Failed to fetch subscription');
  }
  const result = await response.json();
  return result.data;
}

// Fetch credits data
async function fetchCredits(limit = 20, offset = 0): Promise<CreditsData> {
  const response = await fetch(
    `/api/billing/credits?limit=${limit}&offset=${offset}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch credits');
  }
  const result = await response.json();
  return result.data;
}

// Create checkout session
async function createCheckoutSession(
  planId: string,
  billingCycle: 'monthly' | 'yearly'
): Promise<{ url: string; sessionId: string }> {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId, billingCycle }),
  });
  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }
  const result = await response.json();
  return result.data;
}

// Create customer portal session
async function createPortalSession(): Promise<{ url: string }> {
  const response = await fetch('/api/billing/portal', {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to create portal session');
  }
  const result = await response.json();
  return result.data;
}

// Cancel subscription
async function cancelSubscription(
  cancelAtPeriodEnd: boolean
): Promise<{ message: string }> {
  const response = await fetch('/api/billing/subscription', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancelAtPeriodEnd }),
  });
  if (!response.ok) {
    throw new Error('Failed to cancel subscription');
  }
  return response.json();
}

// Use credits
async function useCredits(
  operation: string,
  description?: string,
  metadata?: Record<string, any>
): Promise<{
  transaction: any;
  newBalance: number;
  credits: number;
  trialCredits: number;
}> {
  const response = await fetch('/api/billing/credits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, description, metadata }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to use credits');
  }
  const result = await response.json();
  return result.data;
}

export function useBilling() {
  const queryClient = useQueryClient();

  // Subscription query
  const {
    data: subscription,
    isLoading: isLoadingSubscription,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
  });

  // Credits query
  const {
    data: credits,
    isLoading: isLoadingCredits,
    error: creditsError,
    refetch: refetchCredits,
  } = useQuery({
    queryKey: ['credits'],
    queryFn: () => fetchCredits(),
  });

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: ({
      planId,
      billingCycle,
    }: {
      planId: string;
      billingCycle: 'monthly' | 'yearly';
    }) => createCheckoutSession(planId, billingCycle),
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  // Portal mutation
  const portalMutation = useMutation({
    mutationFn: createPortalSession,
    onSuccess: (data) => {
      // Redirect to Stripe customer portal
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  // Use credits mutation
  const useCreditsTask = useMutation({
    mutationFn: ({
      operation,
      description,
      metadata,
    }: {
      operation: string;
      description?: string;
      metadata?: Record<string, any>;
    }) => useCredits(operation, description, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  // Helper functions
  const startCheckout = useCallback(
    (planId: string, billingCycle: 'monthly' | 'yearly') => {
      checkoutMutation.mutate({ planId, billingCycle });
    },
    [checkoutMutation]
  );

  const openBillingPortal = useCallback(() => {
    portalMutation.mutate();
  }, [portalMutation]);

  const cancelPlan = useCallback(
    (cancelAtPeriodEnd = true) => {
      cancelMutation.mutate(cancelAtPeriodEnd);
    },
    [cancelMutation]
  );

  const spendCredits = useCallback(
    async (
      operation: string,
      description?: string,
      metadata?: Record<string, any>
    ) => {
      return useCreditsTask.mutateAsync({ operation, description, metadata });
    },
    [useCreditsTask]
  );

  // Check if user has enough credits
  const hasCredits = useCallback(
    (required: number) => {
      if (!credits) return false;
      return credits.balance + credits.trialCredits >= required;
    },
    [credits]
  );

  return {
    // Data
    subscription,
    credits,

    // Loading states
    isLoading: isLoadingSubscription || isLoadingCredits,
    isLoadingSubscription,
    isLoadingCredits,

    // Errors
    error: subscriptionError || creditsError,

    // Actions
    startCheckout,
    openBillingPortal,
    cancelPlan,
    spendCredits,
    hasCredits,

    // Mutation states
    isCheckingOut: checkoutMutation.isPending,
    isOpeningPortal: portalMutation.isPending,
    isCanceling: cancelMutation.isPending,
    isSpendingCredits: useCreditsTask.isPending,

    // Refetch
    refetch: () => {
      refetchSubscription();
      refetchCredits();
    },
  };
}
