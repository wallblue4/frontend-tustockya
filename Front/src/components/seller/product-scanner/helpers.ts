import { SizeInfo } from './types';

export const createSizeKey = (size: string, location: string): string => {
  return `${size}|||${location}`;
};

export const extractSizeFromKey = (key: string): string => {
  return key.split('|||')[0];
};

export const extractLocationFromKey = (key: string): string => {
  return key.split('|||')[1] || '';
};

export const findSizeByKey = (sizes: SizeInfo[], selectedKey: string): SizeInfo | undefined => {
  const size = extractSizeFromKey(selectedKey);
  const location = extractLocationFromKey(selectedKey);

  return sizes.find((item) => item.size === size && (item.location_name || item.location) === location);
};

export const getConfidenceCircleStyles = (level: string): string => {
  switch (level) {
    case 'very_high':
      return 'border-lime-500 text-lime-600';
    case 'high':
      return 'border-green-500 text-green-600';
    case 'medium':
      return 'border-yellow-500 text-yellow-600';
    case 'low':
      return 'border-red-500 text-red-600';
    default:
      return 'border-gray-400 text-gray-600';
  }
};

export const getConfidenceLevelText = (level: string): string => {
  switch (level) {
    case 'very_high':
      return 'Muy Alta';
    case 'high':
      return 'Alta';
    case 'medium':
      return 'Media';
    case 'low':
      return 'Baja';
    default:
      return 'Desconocida';
  }
};
