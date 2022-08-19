# Images API

## Scripts needed to test/start/build the application

Clone this repo and install the app with `npm install`. After that, the following scripts are available:

* Star the application in `development` mode: `npm run dev`. This will print additional descriptive comments to the console.
* Build the application for production: `npm run build`.
* Star the application in `production` mode: After the application has been built, run `npm run prod`. No comments will be printed to the console in production mode.
* Run Jasmine tests: `npm run test`. This will build the application and run different tests, including endpoint tests.
* Check for errors using `eslint`: Run `npm run lint`.
* Check for formatting using `prettier`: Run `npm run prettier`

## Application Description

* This is an application that serves a resized image in jpg format from the local folder `./images/full`.
* An original image (i.e., without resizing) with file name `apple.jpg` will be served by visiting the following endpoint:
    `localhost:3000/api/images?filename=apple`
* The image will be resized if either width and height, or both, parameters are added in the url query, and they are different than the original image dimensions.
* If a resized image is served, it will also be stored under the name `<name>_<width>x<height>_thumb.jpg` in the folder `./images/thumb`. This stored image will be served in future requests if the query has the same dimensions.

**Examples**:

**(1)** Assume an image `apple.jpg` is stored in the `images/full` folder with width 1920 and height 1280.

* `localhost:3000/api/images?filename=apple` will always serve the same image without resizing and storing a new image.
* `localhost:3000/api/images?filename=apple&width=1920` will always serve the same image without resizing and storing a new image.
* `localhost:3000/api/images?filename=apple&height=1280` will always serve the same image without resizing and storing a new image.
* `localhost:3000/api/images?filename=apple&width=1920&height=1280` will always serve the same image without resizing and storing a new image.
* `localhost:3000/api/images?filename=apple&width=300` will serve a new resized image with width 300 and auto-scaled height of 200. The auto-scale factor is based on the original image size. The new image will be stored in the `thumb` folder with name `apple_300x200_thumb.jpg`.

**(2)** Assume an image `apple.jpg` is stored in the `images/full` folder with width 1920 and height 1280, and `apple_300x200_thumb.jpg` is stored in the `images/thumb` folder.

* `localhost:3000/api/images?filename=apple&width=300` will serve the image stored in the `thumb` folder. This is because the stored image height correspond to the same aspect ratio of the original image.
* `localhost:3000/api/images?filename=apple&width=300&height=300` will serve and store a new image in the `thumb` folder with width and height of 300.

**(3)** Assume an image `apple.jpg` is stored in the `images/full` folder with width 1920 and height 1280, and `apple_thumb.jpg` is stored in the `images/thumb` folder with width 300 and height 300.

* `localhost:3000/api/images?filename=apple&width=300&height=300` will serve the image stored in the `thumb` folder.
* `localhost:3000/api/images?filename=apple&width=300` will serve a new resized image with width 300 and auto-scaled height of 200 if it does not exist already in the thumb folder.


## Instructions given for this project

* After visiting `/api/images?filename=<jpg_filename>&width=200&height=200`, the resized image should be displayed in the browser.
* The original image is stored in the `images/full` folder.
* The query in the url only includes the name of the file without the extension.
* Work with jpg images only.
* After resizing the image, the resized image should be stored under `images/thumb` with the name `<original_name>_thumb.jpg`.
* If reloading the page or accessing the link with the same width and height, the image is nor reprocessed (it is served from the cache). If width and height are different, the image is reprocessed and saved under the same file, that is, replacing the previous one.
* Run tests with `npm run test` using Jasmine.
* The app should be finally built so it can run with `node dist/index`

## Tasks to accomplish the objectives of the project

- [X] Access an image from the file system under the url `api/images?filename=<filename>`. For this we need to:
    - [X] access query parameters in the url.
    - [X] access the image file from the specific location `./images/full/<image_name>.jpg`
    - [X] display images in the browser using `res.sendFile(<image_path>)`
- [X] Display the image using the width and height specified in the query. Check Sharp (the module) to do this.
- [X] Save the new image in `./images/thumb` if it doesn't exist.
- [X] Serve the image from cache if it already exists locally.
- [X] Write some tests.
- [X] Integrate eslint and prettier.
