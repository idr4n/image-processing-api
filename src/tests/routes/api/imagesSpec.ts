import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import path from 'path';
import supertest from 'supertest';
import app from '../../..';

const request = supertest(app);

const images = [
  { filename: 'fjord', width: '1920', height: '1280' },
  { filename: 'santamonica', width: '1920', height: '1273' },
];

const imagesThumbDir = path.join(__dirname, '../../../../', 'images/thumb');

describe('Test endpoint responses', () => {
  it('gets /', async () => {
    const response = await request.get('/');
    expect(response.status).toBe(200);
  });

  it('gets /api', async () => {
    const response = await request.get('/api');
    expect(response.status).toBe(200);
  });

  it('gets /api/images', async () => {
    const response = await request.get('/api/images');
    expect(response.status).toBe(200);
  });

  describe('test responses with image queries', () => {
    const queryParams = {
      filename: '',
      width: '',
      height: '',
    };

    beforeEach(() => {
      queryParams.filename = '';
      queryParams.width = '';
      queryParams.height = '';
    });

    it('gets /api/images with empty query params', async () => {
      const query = new URLSearchParams(queryParams).toString();

      const response = await request.get(`/api/images?${query}`);
      expect(response.status).toBe(404);
    });

    it('gets /api/images with filename param missing', async () => {
      queryParams.width = '200';
      queryParams.height = '200';
      const query = new URLSearchParams(queryParams).toString();

      const response = await request.get(`/api/images?${query}`);
      expect(response.status).toBe(404);
    });

    images.forEach((image) => {
      it('gets /api/images with filename param only', async () => {
        queryParams.filename = image.filename;
        const query = new URLSearchParams(queryParams).toString();

        const response = await request.get(`/api/images?${query}`);

        expect(response.status).toBe(200);
        expect(response.headers['image-type']).toEqual('Original');
      });
    });

    images.forEach((image) => {
      it('gets /api/images with filename and width', async () => {
        queryParams.filename = image.filename;
        queryParams.width = image.width;
        const query = new URLSearchParams(queryParams).toString();

        const response = await request.get(`/api/images?${query}`);

        expect(response.status).toBe(200);
        expect(response.headers['image-type']).toEqual('Original');
      });
    });

    // these tests create new images in the thumb folder
    describe('create new thumb images', () => {
      images.forEach((image) => {
        queryParams.filename = image.filename;
        queryParams.width = '300';
        queryParams.height = '300';
        const query = new URLSearchParams(queryParams).toString();

        const imageThumbPath = path.join(
          imagesThumbDir,
          `${image.filename}_thumb.jpg`
        );

        it('gets /api/images with filename, width and height', async () => {
          if (existsSync(imageThumbPath)) {
            console.log('* deleting thumb image');
            await rm(imageThumbPath);
          }

          const response = await request.get(`/api/images?${query}`);
          expect(response.headers['image-type']).toEqual('New');
        });
      });
    });

    // these tests serve images from cache
    describe('serve images from cache (thumb folder)', () => {
      const waitTime = 1000;

      beforeAll((done) => {
        setTimeout(() => {
          console.log(
            `\n******** START: Waited ${
              waitTime / 1000
            }s for this suite to start...********`
          );
          done();
        }, waitTime);
      });

      afterAll(() =>
        console.log(
          '************************* END *****************************\n'
        )
      );

      images.forEach((image) => {
        queryParams.filename = image.filename;
        queryParams.width = '300';
        queryParams.height = '300';
        const query = new URLSearchParams(queryParams).toString();

        it('gets /api/images with filename, width and height', async () => {
          const response = await request.get(`/api/images?${query}`);
          expect(response.headers['image-type']).toEqual('Cached');
        });
      });
    });
  });
});
