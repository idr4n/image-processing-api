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
      console.log('file exists in thumb');
      console.log(width, height);

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
function getTargetDims(data: ImageQuery): { width?: number; height?: number } {
  let { width, height } = data;

  if (width && height) {
    return { width, height };
  }
  if (width && !height) {
    return { width };
  }
  if (!width && height) {
    return { height };
  }

  return {};
}

function sameDims(
  localDims: { width?: number; height?: number },
  queryDims: { width?: number; height?: number }
): boolean {
  if (
    (localDims.width === queryDims.width &&
      (!queryDims.height || localDims.height === queryDims.height)) ||
    (localDims.height === queryDims.height &&
      (!queryDims.width || localDims.width === queryDims.width))
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

    // check if original image has same width and/or height as the query
    // if yes, serve without resizing and saving a new one, and we are done!
    if (
      Object.keys(getTargetDims(query)).length === 0 ||
      sameDims(originalImageMetadata, query)
    ) {
      console.log('serving orginal image...');
      res.sendFile(imagePath);
      return;
    }

    // check if image with same dimensions already exists in thumb folder
    // if so, serve that image
    const targetImg = await getThumbImg(imagePath);

    if (targetImg.exists && sameDims(targetImg, query)) {
      console.log('serving cached image from thumb folder...');
      res.sendFile(targetImg.path);
      return;
    }

    // otherwise, serve and save a new resized image
    try {
      const newImage = originalImageObj.resize(getTargetDims(query));
      const newImageBuffer = await newImage.toBuffer();

      console.log('serving resized image...');

      res.contentType('image/jpeg');
      res.send(newImageBuffer);

      // save the new image
      try {
        console.log('saving the new image...');
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

  // check if there is no query being passed and display message if so
  if (Object.keys(req.query).length === 0) {
    res.send(
      'specify your image using /api/images?filename=name&width=number&height=number'
    );
    return;
  }

  // check if original images has same width and height as the query

  // display new image if original exists with resized options
  await displayImage(image, query, res);
});

export default images;
