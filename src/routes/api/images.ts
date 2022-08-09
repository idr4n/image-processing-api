import express, { Response } from 'express';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const images = express.Router();

sharp.cache(false);

interface ImageQuery {
  filename: string;
  width?: number;
  height?: number;
}

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
      console.log('===================================================');
      console.log(
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
 * Returns the appropriate resize options based on the url query params
 */
function getQuerytDims(
  originalData: { width?: number; height?: number },
  queryData: ImageQuery
): { width?: number; height?: number } {
  let { width, height } = queryData;

  let orginalRatio = 1;
  if (originalData.height) {
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
 * Sends the appropriate response to the client by displaying an image or
 * notifying if something is wrong.
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
      console.log('serving orginal image...');
      res.sendFile(imagePath);
      return;
    }

    // check if image with same dimensions, both width and height, already
    // exists in the thumb folder. If so, serve that image. Both width and
    // height have to be provided in the query to serve an image from cache
    const targetImg = await getThumbImg(imagePath);

    // if (targetImg.exists && sameDims(targetImg, query)) {
    if (targetImg.exists && sameDims(targetImg, queryDims)) {
      console.log('* serving cached image from thumb folder...');
      console.log('===================================================');
      res.sendFile(targetImg.path);
      return;
    }

    // otherwise, serve and save a new resized image
    try {
      const newImage = originalImageObj.resize(queryDims);
      const newImageBuffer = await newImage.toBuffer();

      console.log('* serving a resized image...');

      res.contentType('image/jpeg');
      res.send(newImageBuffer);

      // save the new image
      try {
        console.log('* saving the new image...');
        console.log('===================================================');
        await newImage.toFile(targetImg.path);
      } catch (error) {
        console.log('Error saving the image...');
        console.log(error);
      }
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
