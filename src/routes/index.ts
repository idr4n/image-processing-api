import express, { Request, Response } from 'express';
import images from './api/images';

const routes = express.Router();

routes.get('/', (req: Request, res: Response) => {
  res.send(
    'server working... specify the image with /api/images?filename=name&width=number&height=number'
  );
});

routes.get('/api', (req: Request, res: Response) => {
  res.send(
    'Api route... specify the image with /api/images?filename=name&width=number&height=number'
  );
});

routes.use('/api/images', images);

export default routes;
