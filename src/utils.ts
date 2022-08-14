import { Response } from 'express';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import sharp, { Sharp } from 'sharp';
import { ImageDimensions, ImageQuery, ImageType } from './types';

/**
 * Pretty console.log a comment
 */
export function printComment(
  comment: string,
  options: { startSep?: boolean; endSep?: boolean } = {
    startSep: true,
    endSep: true,
  }
) {
  if (process.env.NODE_ENV === 'development') {
    const sep = '===================================================';
    options.startSep && console.log(sep);
    console.log(comment);
    options.endSep && console.log(sep);
  }
}

/**
 * Calculates the appropriate resize options based on the url query params and
 * the size of the original image to get the auto-scale factor. If only one
 * dimension is provided in the query, the other dimension is calculated from
 * the original image aspect ratio (auto-scale factor)
 *
 * Returns an object with width and height properties
 */
export function getQuerytDims(
  originalData: ImageDimensions,
  queryData: ImageQuery
): ImageDimensions | Error {
  const { width, height } = queryData;

  // const dimensionsCheck = checkDimensions(width as number, height as number);
  const dimensionsCheck = checkDimensions(width, height);

  if (!dimensionsCheck.valid) {
    return dimensionsCheck.error as Error;
  }

  let orginalRatio = 1;
  if (originalData.height) {
    // orginalRatio = (originalData.width as number) / originalData.height;
    orginalRatio = (originalData.width as number) / originalData.height;
  }

  if (width && height) {
    return { width, height };
  }
  if (width && !height) {
    const scaledHeight = Math.round(width / orginalRatio);
    return { width, height: scaledHeight };
  }
  if (!width && height) {
    const scaledWidth = Math.round(height * orginalRatio);
    return { width: scaledWidth, height };
  }

  return { width: originalData.width, height: originalData.height };
}

/**
 * Checks if local image has the same dimensions as the query dimension.
 * Returns true or false
 */
export function sameDims(
  localDims: ImageDimensions,
  queryDims: ImageDimensions
): boolean {
  if (
    localDims.width === queryDims.width &&
    localDims.height === queryDims.height
  ) {
    return true;
  }

  return false;
}

/**
* Checks if an image already exists in the thumb folder

* Returs an object with the output file path, whether the image exists or not,
* and a boolean indicating if an image exists or not.
* If an image exists, the object also contains width and height properties
*/
async function getThumbImg(imagePath: string) {
  // check if thumb directory exists, otherwise create
  const outputDir = path.join(path.dirname(imagePath), '../', 'thumb');
  if (!existsSync(outputDir)) {
    await mkdir(outputDir);
  }

  // contruct the file path where the resized image will be saved if it doesn't exist
  const outputFile = path.join(
    outputDir,
    `${path.parse(imagePath).name}_thumb.jpg`
  );

  // returns path, width and height if image already exists
  if (existsSync(outputFile)) {
    try {
      const metaLocalImg = await sharp(outputFile).metadata();
      const { width, height } = metaLocalImg;
      printComment(
        `file exists in thumb with width ${width} and height ${height}`
      );

      return { path: outputFile, exists: true, width, height };
    } catch (error) {
      console.log(error);
      // return {};
      return { path: outputFile, exists: false };
    }
  }

  // returns the path where image will be saved for the first time
  return { path: outputFile, exists: false };
}

function setCustomHeaders(
  res: Response,
  imageType: ImageType,
  imageWidth: number | undefined,
  imageHeight: number | undefined
) {
  res.set({
    'image-type': imageType,
    'image-width': imageWidth,
    'image-height': imageHeight,
  });
}

function isPositiveInt(val: number | undefined): boolean {
  return Number.isInteger(val) && (val as number) > 0;
}

// TODO: add docstrings
export function checkDimensions(
  width: number | undefined,
  height: number | undefined
): { valid: boolean; error: Error | null } {
  if (width === undefined && height === undefined) {
    return { valid: true, error: null };
  }
  if (width === undefined && !isPositiveInt(height)) {
    return {
      valid: false,
      error: new Error('Invalid height. Please enter a positive integer.'),
    };
  }
  if (height === undefined && !isPositiveInt(width)) {
    return {
      valid: false,
      error: new Error('Invalid width. Please enter a positive integer.'),
    };
  }
  if (
    width !== undefined &&
    height !== undefined &&
    (!isPositiveInt(height) || !isPositiveInt(width))
  ) {
    return {
      valid: false,
      error: new Error('Invalid dimensions. Please enter positive integers.'),
    };
  }

  return { valid: true, error: null };
}

// TODO: add docstrings
export async function resizeImage(
  image: Sharp,
  dimensions: ImageDimensions
): Promise<
  | {
      data: Buffer | undefined;
      width: number | undefined;
      height: number | undefined;
    }
  | Error
> {
  const dimensionsCheck = checkDimensions(
    dimensions.width as number,
    dimensions.height as number
  );

  if (!dimensionsCheck.valid) {
    return dimensionsCheck.error as Error;
  }

  try {
    const newImage = await image
      .resize(dimensions)
      .toBuffer({ resolveWithObject: true });
    return {
      data: newImage.data,
      width: newImage.info.width,
      height: newImage.info.height,
    };
  } catch (error) {
    return new Error(`Something went wrong.\n${error}`);
  }
}

/**
 * Sends the appropriate response to the client by displaying an image, new or
 * from cache, saving the image if necessary, and notifying if something is
 * wrong.
 */
export async function displayImage(
  imagePath: string,
  query: ImageQuery,
  res: Response
) {
  if (existsSync(imagePath)) {
    const originalImageObj = sharp(imagePath);
    const originalImageMetadata = await originalImageObj.metadata();
    const queryDims = getQuerytDims(originalImageMetadata, query);

    // if query dimensions are wrong, send an error message to the client
    if (queryDims instanceof Error) {
      res.status(400).send(queryDims.message);
      return;
    }

    // check if original image has same width and/or height as the query
    // if yes, serve without resizing and saving a new one, and we are done!
    if (sameDims(originalImageMetadata, queryDims)) {
      printComment('serving orginal image...');
      setCustomHeaders(
        res,
        ImageType.Original,
        originalImageMetadata.width,
        originalImageMetadata.height
      );
      res.sendFile(imagePath);
      return;
    }

    // check if image with same dimensions, both width and height, already
    // exists in the thumb folder. If so, serve that image. Both width and
    // height have to be provided in the query to serve an image from cache
    const targetImg = await getThumbImg(imagePath);

    // if (targetImg.exists && sameDims(targetImg, query)) {
    if (targetImg.exists && sameDims(targetImg, queryDims)) {
      printComment('* serving cached image from thumb folder...');
      setCustomHeaders(
        res,
        ImageType.Cached,
        targetImg.width,
        targetImg.height
      );
      res.sendFile(targetImg.path);
      return;
    }

    // otherwise, serve and save a new resized image
    const newImage = await resizeImage(originalImageObj, queryDims);

    if (!(newImage instanceof Error) && newImage.data) {
      printComment('* serving a new image...', {
        endSep: false,
        startSep: true,
      });

      res.contentType('image/jpeg');
      setCustomHeaders(res, ImageType.New, newImage.width, newImage.height);
      res.send(newImage.data);

      printComment('* saving the new image...', {
        startSep: false,
        endSep: true,
      });

      await sharp(newImage.data).toFile(targetImg.path);
      return;
    } else if (newImage instanceof Error) {
      res.status(400).send((newImage as Error).message);
      return;
    } else {
      res.send('Something went wrong. No image to show.');
      return;
    }
  }

  printComment('Image file does not exists');
  res
    .status(400)
    .send('Sorry, we cannot find that. Please enter a valid image name.');
}
