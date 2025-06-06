import { create } from 'zustand';
import { Review } from '../types'; // Import Review type from global types
import { apiClient } from '../lib/api'; // Import your API client

// Define the state interface
interface ReviewState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  isReviewsActive: boolean;
}

// Define the actions interface
interface ReviewActions {
  fetchReviews: (eventId: string) => Promise<void>;
  fetchReviewsStatus: () => Promise<void>;
  activateReviews: () => Promise<void>;
  deactivateReviews: () => Promise<void>;
}

// Create the Zustand store
export const useReviewStore = create<ReviewState & ReviewActions>((set) => ({
  // Initial state
  reviews: [],
  isLoading: false,
  error: null,
  isReviewsActive: false,

  // Actions
  fetchReviews: async (eventId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Construct the URL with query parameters
      // The apiClient should handle the base URL.
      const response = await apiClient.get(`/api/reviews?eventId=${eventId}`);
      
      // Assuming the API returns an array of reviews in response.data
      // If your apiClient wraps data differently, adjust here.
      const fetchedReviews: Review[] = response.data; 
      
      set({ reviews: fetchedReviews, isLoading: false });
    } catch (err: any) {
      let errorMessage = 'Failed to fetch reviews.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      console.error('Error fetching reviews:', err);
      set({ error: errorMessage, isLoading: false, reviews: [] }); // Clear reviews on error
    }
  },

  fetchReviewsStatus: async () => {
    try {
      const response = await apiClient.get('/api/reviews/status');
      set({ isReviewsActive: response.data.isActive });
    } catch (err: any) {
      console.error('Error fetching reviews status:', err);
      set({ error: 'Error fetching reviews status' });
    }
  },

  activateReviews: async () => {
    try {
      await apiClient.post('/api/reviews/status/activate');
      set({ isReviewsActive: true });
    } catch (err: any) {
      console.error('Error activating reviews:', err);
      set({ error: 'Error activating reviews form' });
    }
  },

  deactivateReviews: async () => {
    try {
      await apiClient.post('/api/reviews/status/deactivate');
      set({ isReviewsActive: false });
    } catch (err: any) {
      console.error('Error deactivating reviews:', err);
      set({ error: 'Error deactivating reviews form' });
    }
  },
}));
