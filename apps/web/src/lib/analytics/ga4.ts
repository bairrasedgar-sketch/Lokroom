import ReactGA from 'react-ga4';
import { logger } from "@/lib/logger";


// Types pour les événements analytics
export interface SearchEvent {
  query: string;
  filters?: {
    category?: string;
    priceMin?: number;
    priceMax?: number;
    location?: string;
    guests?: number;
  };
}

export interface ListingClickEvent {
  listingId: string;
  listingTitle: string;
  category: string;
  price: number;
  position?: number;
}

export interface FavoriteEvent {
  listingId: string;
  action: 'add' | 'remove';
}

export interface BookingEvent {
  listingId: string;
  listingTitle: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  guests: number;
}

export interface BookingCompletedEvent extends BookingEvent {
  bookingId: string;
  paymentMethod: string;
}

// Configuration GA4
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

let isInitialized = false;

/**
 * Initialise Google Analytics 4
 */
export const initGA = () => {
  if (!GA_MEASUREMENT_ID) {
    logger.warn('GA4: NEXT_PUBLIC_GA_MEASUREMENT_ID not configured');
    return;
  }

  if (isInitialized) {
    return;
  }

  try {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      gaOptions: {
        anonymizeIp: true,
        cookieFlags: 'SameSite=None;Secure',
      },
      gtagOptions: {
        send_page_view: false, // On gère manuellement les page views
      },
    });
    isInitialized = true;
    logger.debug('GA4: Initialized successfully');
  } catch (error) {
    logger.error('GA4: Initialization failed', error);
  }
};

/**
 * Track une page view
 */
export const trackPageView = (path: string, title?: string) => {
  if (!isInitialized) return;

  try {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title,
    });
  } catch (error) {
    logger.error('GA4: Page view tracking failed', error);
  }
};

/**
 * Track une recherche
 */
export const trackSearch = (event: SearchEvent) => {
  if (!isInitialized) return;

  try {
    ReactGA.event('search', {
      search_term: event.query,
      category: event.filters?.category,
      price_min: event.filters?.priceMin,
      price_max: event.filters?.priceMax,
      location: event.filters?.location,
      guests: event.filters?.guests,
    });
  } catch (error) {
    logger.error('GA4: Search tracking failed', error);
  }
};

/**
 * Track un clic sur une annonce
 */
export const trackListingClick = (event: ListingClickEvent) => {
  if (!isInitialized) return;

  try {
    ReactGA.event('select_item', {
      item_list_name: 'Search Results',
      items: [
        {
          item_id: event.listingId,
          item_name: event.listingTitle,
          item_category: event.category,
          price: event.price,
          index: event.position,
        },
      ],
    });
  } catch (error) {
    logger.error('GA4: Listing click tracking failed', error);
  }
};

/**
 * Track l'ajout/suppression d'un favori
 */
export const trackFavorite = (event: FavoriteEvent) => {
  if (!isInitialized) return;

  try {
    ReactGA.event(event.action === 'add' ? 'add_to_wishlist' : 'remove_from_wishlist', {
      listing_id: event.listingId,
    });
  } catch (error) {
    logger.error('GA4: Favorite tracking failed', error);
  }
};

/**
 * Track le début d'une réservation
 */
export const trackBeginCheckout = (event: BookingEvent) => {
  if (!isInitialized) return;

  try {
    ReactGA.event('begin_checkout', {
      currency: 'EUR',
      value: event.totalPrice,
      items: [
        {
          item_id: event.listingId,
          item_name: event.listingTitle,
          price: event.totalPrice,
          quantity: 1,
        },
      ],
      start_date: event.startDate,
      end_date: event.endDate,
      guests: event.guests,
    });
  } catch (error) {
    logger.error('GA4: Begin checkout tracking failed', error);
  }
};

/**
 * Track une réservation complétée (conversion)
 */
export const trackBookingCompleted = (event: BookingCompletedEvent) => {
  if (!isInitialized) return;

  try {
    ReactGA.event('purchase', {
      transaction_id: event.bookingId,
      currency: 'EUR',
      value: event.totalPrice,
      items: [
        {
          item_id: event.listingId,
          item_name: event.listingTitle,
          price: event.totalPrice,
          quantity: 1,
        },
      ],
      payment_method: event.paymentMethod,
      start_date: event.startDate,
      end_date: event.endDate,
      guests: event.guests,
    });
  } catch (error) {
    logger.error('GA4: Booking completed tracking failed', error);
  }
};

/**
 * Track un événement custom
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (!isInitialized) return;

  try {
    ReactGA.event(eventName, eventParams);
  } catch (error) {
    logger.error(`GA4: Event tracking failed for ${eventName}`, error);
  }
};

/**
 * Set user properties
 */
export const setUserProperties = (properties: Record<string, any>) => {
  if (!isInitialized) return;

  try {
    ReactGA.set(properties);
  } catch (error) {
    logger.error('GA4: Set user properties failed', error);
  }
};

/**
 * Set user ID (pour le suivi cross-device)
 */
export const setUserId = (userId: string | null) => {
  if (!isInitialized) return;

  try {
    if (userId) {
      ReactGA.set({ userId });
    }
  } catch (error) {
    logger.error('GA4: Set user ID failed', error);
  }
};
