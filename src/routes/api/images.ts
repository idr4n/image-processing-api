import express, { Request, Response } from 'express';
import path from 'path';
import sharp from 'sharp';
import { ImageQuery } from '../../types';
import { displayImage } from '../../utils';

const images = express.Router();

// sets sharp's cache to 0
sharp.cache(false);

images.get('/', async (req: Request, res: Response) => {
  // get the query parameters
  const query: ImageQuery = {
    filename: req.query.filename as string,
    width: req.query.width ? parseFloat(req.query.width as string) : undefined,
    height: req.query.height
      ? parseFloat(req.query.height as string)
      : undefined,
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
