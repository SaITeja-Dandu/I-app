/**
 * @file components/FavoriteButton.tsx
 * @description Heart button to add/remove interviewers from favorites
 */

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { getFavoritesService } from '../services/favorites';
import { createLogger } from '../utils/logger';

const logger = createLogger('favorite-button');

interface FavoriteButtonProps {
  candidateId: string;
  interviewerId: string;
  interviewerName: string;
  interviewerTitle?: string;
  interviewerCompany?: string;
  interviewerRating?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onToggle?: (isFavorite: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  candidateId,
  interviewerId,
  interviewerName,
  interviewerTitle,
  interviewerCompany,
  interviewerRating,
  size = 'md',
  className = '',
  onToggle,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkFavoriteStatus();
  }, [candidateId, interviewerId]);

  const checkFavoriteStatus = async () => {
    try {
      const favoritesService = getFavoritesService();
      const status = await favoritesService.isFavorite(candidateId, interviewerId);
      setIsFavorite(status);
    } catch (error) {
      logger.error({ error }, 'Failed to check favorite status');
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isLoading) return;

    try {
      setIsLoading(true);
      const favoritesService = getFavoritesService();

      if (isFavorite) {
        await favoritesService.removeFavorite(candidateId, interviewerId);
        setIsFavorite(false);
        logger.info({ interviewerId }, 'Removed from favorites');
      } else {
        await favoritesService.addFavorite(
          candidateId,
          interviewerId,
          {
            name: interviewerName,
            title: interviewerTitle,
            company: interviewerCompany,
            rating: interviewerRating,
          }
        );
        setIsFavorite(true);
        logger.info({ interviewerId }, 'Added to favorites');
      }

      onToggle?.(isFavorite);
    } catch (error) {
      logger.error({ error }, 'Failed to toggle favorite');
      alert('Failed to update favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        transition-all duration-200
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}
        ${className}
      `}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`
          ${sizeClasses[size]}
          transition-colors duration-200
          ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}
        `}
      />
    </button>
  );
};
