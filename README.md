# Images API

## Instructions for this project

* After visiting `/api/images?filename=<jpg_filename>&width=200&height=200`, the resized image should be displayed in the browser.
* The original image is stored in the `images/full` folder.
* The query in the url only includes the name of the file without the extension.
* We will only work with jpg images.
* After resizing the image, the resized image should be stored under `images/thumb` with the name `<original_name>_thumb.jpg`.
* If reloading the page or accessing the link with the same width and height, the image is nor reprocessed (it is served from cached). If width and height are different, the image is reprocessed and saved under the same file, that is, replacing the previous one.
* We should be able to run tests with `npm run test` using Jasmine. Three tests should be enough.
* The app should be finally built and so it can be run with `node dist/index`

## Tasks to do to accomplish the objectives of the project

- [X] Access an image from the file system under the url `api/images?filename=<filename>`. For this we need to:
    - [X] access query parameters in the url.
    - [X] access the image file from the specific location `./images/full/<image_name>.jpg`
    - [X] display images in the browser using `res.sendFile(<image_path>)`
- [X] Display the image using the width and height specified in the query. Check Sharp (the module) to do this.
- [ ] Save the new image in `./images/thumb`
- [ ] Serve the image from cache if it exists locally already
- [ ] Write some tests
- [ ] Integrate eslint and prettier
