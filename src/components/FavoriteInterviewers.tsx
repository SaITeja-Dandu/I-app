/**
 * @file components/FavoriteInterviewers.tsx
 * @description Component to display and manage favorite interviewers
 */

import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { getFavoritesService, type FavoriteInterviewer } from '../services/favorites';
import { createLogger } from '../utils/logger';
import { Star, Trash2, MessageCircle, Calendar } from 'lucide-react';

const logger = createLogger('favorite-interviewers');

interface FavoriteInterviewersProps {
  userId: string;
  onBookInterview?: (interviewerId: string) => void;
}

export const FavoriteInterviewers: React.FC<FavoriteInterviewersProps> = ({
  userId,
  onBookInterview,
}) => {
  const [favorites, setFavorites] = useState<FavoriteInterviewer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const favoritesService = getFavoritesService();
      const data = await favoritesService.getFavorites(userId);
      setFavorites(data.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime()));
    } catch (error) {
      logger.error({ error }, 'Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (interviewerId: string) => {
    try {
      setRemovingId(interviewerId);
      const favoritesService = getFavoritesService();
      await favoritesService.removeFavorite(userId, interviewerId);
      setFavorites(favorites.filter((f) => f.interviewerId !== interviewerId));
      logger.info({ interviewerId }, 'Removed from favorites');
    } catch (error) {
      logger.error({ error, interviewerId }, 'Failed to remove favorite');
      alert('Failed to remove from favorites');
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading favorites..." />
        </div>
      </Card>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card className="text-center py-12">
        <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Favorite Interviewers</h3>
        <p className="text-gray-600">
          Save your favorite interviewers for quick access later
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {favorites.map((favorite) => (
        <Card key={favorite.id} className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {favorite.interviewerName}
                </h3>
                {favorite.interviewerRating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-700">
                      {favorite.interviewerRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {(favorite.interviewerTitle || favorite.interviewerCompany) && (
                <p className="text-gray-600 mb-3">
                  {favorite.interviewerTitle}
                  {favorite.interviewerTitle && favorite.interviewerCompany && ' at '}
                  {favorite.interviewerCompany}
                </p>
              )}

              {favorite.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-900">{favorite.notes}</p>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Added {favorite.addedAt.toLocaleDateString()}
              </p>
            </div>

            <div className="flex flex-col gap-2 ml-4">
              {onBookInterview && (
                <Button
                  onClick={() => onBookInterview(favorite.interviewerId)}
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Calendar className="h-4 w-4" />
                  Book Interview
                </Button>
              )}
              
              <Button
                onClick={() => handleRemove(favorite.interviewerId)}
                disabled={removingId === favorite.interviewerId}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {removingId === favorite.interviewerId ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Remove
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
