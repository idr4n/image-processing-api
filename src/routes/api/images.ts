import express, { Response } from 'express';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const images = express.Router();

// sets sharp's cache to 0
sharp.cache(false);

interface ImageQuery {
  filename: string;
  width?: number;
  height?: number;
}

/**
 * Pretty console.log a comment
 */
function printComment(
  comment: string,
  separator: { up?: boolean; down?: boolean } = { up: true, down: true }
) {
  const sep = '===================================================';
  separator.up && console.log(sep);
  console.log(comment);
  separator.down && console.log(sep);
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

/**
 * Calculates the appropriate resize options based on the url query params and
 * the size of the original image to get the auto-scale factor. If only one
 * dimension is provided in the query, the other dimension is calculated from
 * the original image aspect ratio (auto-scale factor)
 *
 * Returns an object with width and height properties
 */
function getQuerytDims(
  originalData: { width?: number; height?: number },
  queryData: ImageQuery
): { width?: number; height?: number } {
  let { width, height } = queryData;

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
function sameDims(
  localDims: { width?: number; height?: number },
  queryDims: { width?: number; height?: number }
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
 * Sends the appropriate response to the client by displaying an image, new or
 * from cache, saving the image if necessary, and notifying if something is
 * wrong.
 */
async function displayImage(
  imagePath: string,
  query: ImageQuery,
  res: Response
) {
  if (existsSync(imagePath)) {
    const originalImageObj = sharp(imagePath);
    const originalImageMetadata = await originalImageObj.metadata();
    const queryDims = getQuerytDims(originalImageMetadata, query);

    // check if original image has same width and/or height as the query
    // if yes, serve without resizing and saving a new one, and we are done!
    if (sameDims(originalImageMetadata, queryDims)) {
      printComment('serving orginal image...');
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
      res.sendFile(targetImg.path);
      return;
    }

    // otherwise, serve and save a new resized image
    try {
      const newImage = originalImageObj.resize(queryDims);
      const newImageBuffer = await newImage.toBuffer();

      printComment('* serving a new image...', { down: false, up: true });

      res.contentType('image/jpeg');
      res.send(newImageBuffer);

      printComment('* saving the new image...', { up: false, down: true });
      await newImage.toFile(targetImg.path);
    } catch (error) {
      console.log(error);
      res.send('Something went wrong...');
    }
    return;
  }

  console.log('Image file does not exists');
  res.status(404).send('Sorry, we cannot find that!');
}

images.get('/', async (req, res) => {
  // get the query parameters
  const query: ImageQuery = {
    filename: req.query.filename as string,
    width: parseFloat(req.query.width as string),
    height: parseFloat(req.query.height as string),
  };

  // construct the image file path
  const imagesDir = path.join(__dirname, '../../../', 'images/');
  const image = `${imagesDir + 'full/' + query.filename}.jpg`;

  // check if there is no query being passed. If so, display message.
  if (Object.keys(req.query).length === 0) {
    res.send(
      'specify your image using /api/images?filename=name&width=number&height=number'
    );
    return;
  }

  // display image
  await displayImage(image, query, res);
});

export default images;
