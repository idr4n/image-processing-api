import express, { Response } from 'express';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

const images = express.Router();

interface ImageQuery {
  filename: string;
  width?: number;
  height?: number;
}

/**
 * Returns the appropriate resize options based on the url query params
 */
const getResizeOpts = (
  data: ImageQuery
): { width?: number; height?: number } => {
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
};

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
    console.log(query.width, query.height);
    try {
      const newImage = await sharp(imagePath)
        .resize(getResizeOpts(query))
        .toBuffer({ resolveWithObject: true });

      res.contentType('image/jpeg');
      res.send(newImage.data);
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
  const imagesDir = path.join(__dirname, '../../../', 'images/full/');
  const image = `${imagesDir + query.filename}.jpg`;

  // check if there is no query being passed and display message if so
  if (Object.keys(req.query).length === 0) {
    res.send(
      'specify your image using /api/images?filename=name&width=number&height=number'
    );
    return;
  }

  // display image if exists with the resize options
  await displayImage(image, query, res);
});

export default images;
