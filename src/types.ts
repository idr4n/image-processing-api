/**
 * Image query interface
 */
export interface ImageQuery {
  filename: string;
  width?: number;
  height?: number;
}

/**
 * Image Dimensions interface
 */
export interface ImageDimensions {
  width?: number;
  height?: number;
}

/**
 * Enum for Image type
 */
export enum ImageType {
  Original = 'Original',
  Cached = 'Cached',
  New = 'New',
}
