import path from 'path';
import sharp from 'sharp';
import { ImageDimensions, ImageQuery } from '../types';
import { getQuerytDims, resizeImage, sameDims } from '../utils';

describe('Tests for some of the utils functions', () => {
  let aspectRatio: number;
  let widthOriginal: number;
  let heightOriginal: number;
  let widthQuery: number;
  let heightQuery: number;
  let originalData: ImageDimensions;
  let queryData: ImageQuery;

  beforeEach(() => {
    aspectRatio = 1.2;
    widthOriginal = 600;
    heightOriginal = Math.round(widthOriginal / aspectRatio);

    widthQuery = 200;
    heightQuery = 200;

    originalData = {
      width: widthOriginal,
      height: heightOriginal,
    };

    queryData = {
      filename: 'testImage',
      width: widthQuery,
      height: heightQuery,
    };
  });

  describe('function getQueryDims return object for different queries', () => {
    it('returns orginal dimensions when no query provided', () => {
      queryData.width = undefined;
      queryData.height = undefined;

      expect(getQuerytDims(originalData, queryData)).toEqual({
        width: widthOriginal,
        height: heightOriginal,
      });
    });

    it('returns scaled dimensions when only width is provided', () => {
      queryData.height = undefined;

      expect(getQuerytDims(originalData, queryData)).toEqual({
        width: widthQuery,
        height: Math.round(widthQuery / aspectRatio),
      });
    });

    it('returns scaled dimensions when only height is provided', () => {
      queryData.width = undefined;

      expect(getQuerytDims(originalData, queryData)).toEqual({
        width: Math.round(heightQuery * aspectRatio),
        height: heightQuery,
      });
    });

    it('returns query dimensions when both height and width are provided', () => {
      expect(getQuerytDims(originalData, queryData)).toEqual({
        width: widthQuery,
        height: heightQuery,
      });
    });
  });

  describe('function sameDims return value for different queries', () => {
    it('returns false when no query is provided', () => {
      queryData.width = undefined;
      queryData.height = undefined;

      expect(sameDims(originalData, queryData)).toEqual(false);
    });

    it('returns false when only width is provided and is the same', () => {
      queryData.height = undefined;
      queryData.width = originalData.width;

      expect(sameDims(originalData, queryData)).toEqual(false);
    });

    it('returns false when only height is provided', () => {
      queryData.width = undefined;

      expect(sameDims(originalData, queryData)).toEqual(false);
    });

    it('returns true when both height and width are the same', () => {
      queryData.width = originalData.width as number;
      queryData.height = Math.round(queryData.width / aspectRatio);

      expect(sameDims(originalData, queryData)).toEqual(true);
    });
  });

  describe('resize image using different params', () => {
    it('returns an object with a data, width and height', async () => {
      const width = 300;
      const height = 300;
      const imagePath = path.join(__dirname, '../../images/full/fjord.jpg');
      const newImage = await resizeImage(sharp(imagePath), { width, height });

      if (!(newImage instanceof Error)) {
        expect(newImage.width).toEqual(width);
        expect(newImage.height).toEqual(height);
        expect(newImage.data).toBeTruthy();
      }
    });

    it('negative dimensions returns an Error', async () => {
      const width = -300;
      const height = -300;
      const imagePath = path.join(__dirname, '../../images/full/fjord.jpg');
      const newImage = await resizeImage(sharp(imagePath), { width, height });

      expect(newImage).toBeInstanceOf(Error);
    });

    it('wrong image path returns an Error', async () => {
      const width = 300;
      const height = 300;
      const imagePath = path.join(
        __dirname,
        '../../images/full/not_an_image.jpg'
      );
      const newImage = await resizeImage(sharp(imagePath), { width, height });

      expect(newImage).toBeInstanceOf(Error);
    });
  });
});
