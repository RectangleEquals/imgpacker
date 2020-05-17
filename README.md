# imgpacker

A multipurpose command-line image processing and tiling utility.

## Download

__Todo__: Include link(s) to binary releases here

## Usage

#### `imgpacker [Options] <CellSize> <Columns> <OutputFile> [InputFolder]`

|Option										|Description|
|-------------------------------------------|-----------------------------|
|`-ba`<br/>`--blurAfter`					|Blurs input images _after_ resizing|
|`-bb`<br/>`--blurBefore`					|Blurs input images _before_ resizing|
|`-sa`<br/>`--sharpenAfter`					|Sharpens input images _after_ resizing|
|`-sb`<br/>`--sharpenBefore`				|Sharpens input images _before_ resizing|
|`-ma`<br/>`--medianAfter`					|Applies a median filter to input images _after_ resizing|
|`-mb`<br/>`--medianBefore`					|Applies a median filter to input images _before_ resizing|
|`-fy`<br/>`--flip`							|Flip the image about the vertical Y axis|
|`-fx`<br/>`--flop`							|Flop the image about the horizontal X axis|
|`-fl[#RRGGBB]`<br/>`--flatten[#RRGGBB]`	|Merge alpha transparency channel, if any, with a background<br/>color (specified in hex). Default color is #000000|

## Building

### Dependencies

- This is a [Node.js](https://nodejs.org/) project, which makes use of the following modules:
  - [photo-collage](https://github.com/classdojo/photo-collage)
    - __Note__: Using [this forked version](https://github.com/RectangleEquals/photo-collage) which utilizes Canvas v2.x instead of v1.x
  - [node-canvas](https://github.com/Automattic/node-canvas)
  - [image-type](https://github.com/sindresorhus/image-type)
  - [is-svg](https://github.com/sindresorhus/is-svg)
  - [read-chunk](https://github.com/sindresorhus/read-chunk)
  - [sharp](https://github.com/lovell/sharp)

- This project has the following dev dependencies:
  - [nexe](https://github.com/nexe/nexe#readme)

### Instructions

- Install the above dependencies. This should be easily done by executing `npm install` from within the project's root folder.
- __Windows__: Execute `npm run build` from within the project's root folder. This should create a binary executable within the same folder.
- __MacOS/Linux__: I'm not sure if [nexe](https://github.com/nexe/nexe#readme) can build binaries for you, but you should be able to run the app via `npm run imgpacker.js [args]`. There are also other solutions, such as [pkg](https://github.com/zeit/pkg).
