# imgpacker

A multipurpose command-line image processing and tiling utility.

## Download

__Todo__: Include link(s) to binary releases here

## Build Dependencies

This is a [Node.js](https://nodejs.org/) project, which makes use of the following modules:
- [photo-collage](https://github.com/classdojo/photo-collage)
  - __Note__: Using [this forked version](https://github.com/RectangleEquals/photo-collage) which utilizes Canvas v2.x instead of v1.x
- [node-canvas](https://github.com/Automattic/node-canvas)
- [image-type](https://github.com/sindresorhus/image-type)
- [is-svg](https://github.com/sindresorhus/is-svg)
- [read-chunk](https://github.com/sindresorhus/read-chunk)
- [sharp](https://github.com/lovell/sharp)

This project has the following dev dependencies:
- [nexe](https://github.com/nexe/nexe#readme)

## Building

- Install the above [dependencies](https://github.com/RectangleEquals/imgpacker#build-dependencies). This should be easily done by executing `npm install` from within the project's root folder.
- __Windows__: Execute `npm run build` from within the project's root folder. This should create a binary executable within the same folder.
- __MacOS/Linux__: I'm not sure if [nexe](https://github.com/nexe/nexe#readme) can build binaries for you, but you should be able to run the app via `npm run imgpacker.js [args]`. There are also other solutions, such as [pkg](https://github.com/zeit/pkg).

## Usage

__Todo__: Modify table below to show proper usage and options

|                |ASCII                          |HTML                         |
|----------------|-------------------------------|-----------------------------|
|Single backticks|`'Isn't this fun?'`            |'Isn't this fun?'            |
|Quotes          |`"Isn't this fun?"`            |"Isn't this fun?"            |
|Dashes          |`-- is en-dash, --- is em-dash`|-- is en-dash, --- is em-dash|
