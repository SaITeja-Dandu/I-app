/**
 * @file services/favorites.ts
 * @description Service for managing candidate's favorite/saved interviewers
 */

import { Firestore, collection, doc, setDoc, deleteDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { createLogger } from '../utils/logger';

const logger = createLogger('favorites-service');

export interface FavoriteInterviewer {
  id: string;
  candidateId: string;
  interviewerId: string;
  interviewerName: string;
  interviewerTitle?: string;
  interviewerCompany?: string;
  interviewerRating?: number;
  addedAt: Date;
  notes?: string;
}

class FavoritesService {
  private db: Firestore;
  private initialized: boolean = false;

  constructor(db: Firestore) {
    this.db = db;
    this.initialized = true;
  }

  /**
   * Add interviewer to favorites
   */
  async addFavorite(
    candidateId: string,
    interviewerId: string,
    interviewerData: {
      name: string;
      title?: string;
      company?: string;
      rating?: number;
    },
    notes?: string
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('FavoritesService not initialized');
    }

    try {
      const favoriteId = `${candidateId}_${interviewerId}`;
      const favoritesRef = doc(this.db, 'favorites', favoriteId);

      const favorite: Omit<FavoriteInterviewer, 'id'> = {
        candidateId,
        interviewerId,
        interviewerName: interviewerData.name,
        interviewerTitle: interviewerData.title,
        interviewerCompany: interviewerData.company,
        interviewerRating: interviewerData.rating,
        addedAt: new Date(),
        notes,
      };

      await setDoc(favoritesRef, {
        ...favorite,
        addedAt: Timestamp.fromDate(favorite.addedAt),
      });

      logger.info({ candidateId, interviewerId }, 'Interviewer added to favorites');
      return favoriteId;
    } catch (error) {
      logger.error({ error, candidateId, interviewerId }, 'Failed to add favorite');
      throw error;
    }
  }

  /**
   * Remove interviewer from favorites
   */
  async removeFavorite(candidateId: string, interviewerId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('FavoritesService not initialized');
    }

    try {
      const favoriteId = `${candidateId}_${interviewerId}`;
      const favoritesRef = doc(this.db, 'favorites', favoriteId);
      await deleteDoc(favoritesRef);

      logger.info({ candidateId, interviewerId }, 'Interviewer removed from favorites');
    } catch (error) {
      logger.error({ error, candidateId, interviewerId }, 'Failed to remove favorite');
      throw error;
    }
  }

  /**
   * Get all favorites for a candidate
   */
  async getFavorites(candidateId: string): Promise<FavoriteInterviewer[]> {
    if (!this.initialized) {
      throw new Error('FavoritesService not initialized');
    }

    try {
      const favoritesRef = collection(this.db, 'favorites');
      const q = query(favoritesRef, where('candidateId', '==', candidateId));
      const snapshot = await getDocs(q);

      const favorites: FavoriteInterviewer[] = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          candidateId: data.candidateId,
          interviewerId: data.interviewerId,
          interviewerName: data.interviewerName,
          interviewerTitle: data.interviewerTitle,
          interviewerCompany: data.interviewerCompany,
          interviewerRating: data.interviewerRating,
          addedAt: data.addedAt?.toDate() || new Date(),
          notes: data.notes,
        };
      });

      logger.info({ candidateId, count: favorites.length }, 'Favorites retrieved');
      return favorites;
    } catch (error) {
      logger.error({ error, candidateId }, 'Failed to get favorites');
      throw error;
    }
  }

  /**
   * Check if interviewer is favorited
   */
  async isFavorite(candidateId: string, interviewerId: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('FavoritesService not initialized');
    }

    try {
      const favoriteId = `${candidateId}_${interviewerId}`;
      const snapshot = await getDocs(query(collection(this.db, 'favorites'), where('__name__', '==', favoriteId)));
      
      return !snapshot.empty;
    } catch (error) {
      logger.error({ error, candidateId, interviewerId }, 'Failed to check favorite status');
      return false;
    }
  }

  /**
   * Update notes for a favorite
   */
  async updateNotes(candidateId: string, interviewerId: string, notes: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('FavoritesService not initialized');
    }

    try {
      const favoriteId = `${candidateId}_${interviewerId}`;
      const favoritesRef = doc(this.db, 'favorites', favoriteId);
      
      await setDoc(favoritesRef, { notes }, { merge: true });

      logger.info({ candidateId, interviewerId }, 'Favorite notes updated');
    } catch (error) {
      logger.error({ error, candidateId, interviewerId }, 'Failed to update notes');
      throw error;
    }
  }
}

let favoritesServiceInstance: FavoritesService | null = null;

export function initializeFavoritesService(db: Firestore): FavoritesService {
  if (!favoritesServiceInstance) {
    favoritesServiceInstance = new FavoritesService(db);
    logger.info('FavoritesService initialized');
  }
  return favoritesServiceInstance;
}

export function getFavoritesService(): FavoritesService {
  if (!favoritesServiceInstance) {
    throw new Error('FavoritesService not initialized. Call initializeFavoritesService first.');
  }
  return favoritesServiceInstance;
}
