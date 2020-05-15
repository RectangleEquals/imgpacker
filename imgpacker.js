var fs = require('fs');
const path = require('path');
const readChunk = require('read-chunk');
const imageType = require('image-type');
const isSvg = require('is-svg');
const sharp = require('sharp');
const createCollage = require("photo-collage");

const MIN_ARG_COUNT = 3;
const MIN_COLUMNS = 1;
const MIN_CELL_SIZE = 4;
const INPUT_QUALITY = 100;

var args = process.argv.slice(2);
//console.debug('args: ', args);
if(args.length < MIN_ARG_COUNT) {
    if(args.length > 0)
        console.error('[ERROR]: Invalid number of arguments');
    showUsage();
}

const CELL_SIZE = parseInt(args[0]);
const MAX_COLUMNS = parseInt(args[1]);
const OUT_PATH = args[2];
const IN_PATH = args[3] || process.cwd();
const IN_PATH_INFO = path.parse(IN_PATH);
const OUT_PATH_INFO = path.parse(OUT_PATH);

if(CELL_SIZE < MIN_CELL_SIZE) {
    console.error('[ERROR]: CellSize must be at least ' + MIN_CELL_SIZE.toString());
    process.exit(1);
}

if(MAX_COLUMNS < MIN_COLUMNS) {
    console.error('[ERROR]: Columns must be at least ' + MIN_COLUMNS.toString());
    process.exit(1);
}

console.debug('\t- [root]: `' + IN_PATH_INFO.root + '`\n\t- [dir]: `' + IN_PATH_INFO.dir + '`\n\t- [base]: `' + IN_PATH_INFO.base + '`');
if(IN_PATH_INFO.root.length < 1 || IN_PATH_INFO.dir.length < 1 || !fs.existsSync(IN_PATH))
{
    console.error('[ERROR]: Invalid InputFolder path: `' + IN_PATH + '`');
    process.exit(1);
}

if(!fs.existsSync(OUT_PATH_INFO.dir)) {
    console.error('[ERROR]: Invalid OutputFile path: `' + OUT_PATH_INFO.dir + '`');
    process.exit(1);
}

fs.readdir(IN_PATH, function(err, files)
{
    if(err) {
        console.error(err);
        process.exit(1);
    }

    var images = [];
    for (var i = 0; i < files.length; i++) {
        let filePath = validatePath(files[i]);
        let stat = fs.statSync(filePath);
        if(!stat.isFile())
            continue;
        if(isSupportedImageFile(filePath))
            images.push(filePath);
        else
            console.warn('[SKIPPED]: `' + filePath + '` (unsupported file format)');
    }
    if(images.length < 1) {
        console.error('[ERROR]: Failed to find any supported images in `' + IN_PATH + '`');
        process.exit(1);
    }

    processImages(images.sort());
});

function showUsage() {
    console.info('Image Packer v0.1a');
    console.info('Authored by: Michael Wion (https://github.com/RectangleEquals)');
    console.info('Usage: imgpacker [Options] <CellSize> <Columns> <OutputFile> [InputFolder]');
    console.info('');
    console.info('Example: imgpacker --sharpenAfter 32 10 "C:\\OutputImage.png" "C:\\Images"');
    console.info('\tCopies all images found in "C:\\Images", resizes them to 32x32px, sharpens them, tiles them into 10 max columns, and saves the result to "C:\\OutputImage.png"');
    console.info('');
    console.info('Options:');
    console.info('\t-ba, --blurAfter\t\tBlurs input images AFTER resizing');
    console.info('\t-bb, --blurBefore\t\tBlurs input images BEFORE resizing');
    console.info('\t-sa, --sharpenAfter\t\tSharpens input images AFTER resizing');
    console.info('\t-sb, --sharpenBefore\t\tSharpens input images BEFORE resizing');
    process.exit(0);
}

function validatePath(filePath)
{
    var p = path.parse(filePath);
    var dir = path.join(p.root, p.dir);
    if(p.root.length < 1 && p.dir.length < 1)
        dir = IN_PATH;

    return path.join( dir, filePath );
}

function isSupportedImageFile(filePath)
{
    var stat = fs.statSync(filePath);
    if(!stat.isFile())
        return false;
    
    if(filePath.endsWith('.svg')) {
        const buffer = readChunk.sync(filePath, 0, stat.size);
        return isSvg(buffer);
    }

    const buffer = readChunk.sync(filePath, 0, 12);
    //console.debug('==========[`' + filePath + '`]==========');
    let result = imageType(buffer);
    if(!result)
        return false;

    let isSupported = 
        result.mime === 'image/jpeg' ||
        result.mime === 'image/png' ||
        result.mime === 'image/webp' ||
        result.mime === 'image/tiff' ||
        result.mime === 'image/gif';

    //console.debug('[' + result.mime + ']: ' + (isSupported ? 'true' : 'false'));

    return isSupported;
}

function processImages(imagePaths)
{
    var index = 0;
    const rows = imagePaths.length / MAX_COLUMNS;

    const pngOptions = {
        quality: INPUT_QUALITY
    };

    // Next, apply all transformations
    var buffers = [];
    imagePaths.forEach(imgPath =>
    {
        var pathInfo = path.parse(imgPath);
        var pngImage = sharp(imgPath).png(pngOptions);
        pngImage.metadata().then(metadata => {
            pngImage.resize(CELL_SIZE, CELL_SIZE)
            .sharpen()
            .toBuffer()
            .then((buffer) => {
                buffers.push(buffer);
                index++;
                console.debug('[Processed]: ' + index.toString() + ' of ' + imagePaths.length.toString() + ' (' + (Math.round((index / imagePaths.length) * 100)).toString() + '%)');
                if(index == imagePaths.length)
                    packImages(buffers, rows);
            }, (reason) => {
                console.error('[ERROR]: Failed to create buffer for `' + pathInfo.base + '`... Reason:');
                console.error(reason);
                process.exit(1);
            });
        }, reason => {
            console.error('[ERROR]: Failed to get metadata for `' + pathInfo.base + '`... Reason:');
            console.error(reason);
            process.exit(1);
    });
    });
}

function packImages(inBuffers, rows)
{
    var options = {
        sources: inBuffers,
        width: MAX_COLUMNS, // number of images per row
        height: rows, // number of images per column
        imageWidth: CELL_SIZE, // width of each image
        imageHeight: CELL_SIZE, // height of each image
    };
    
    createCollage(options)
    .catch((err) => {
        console.error('[ERROR]: Failed to pack images! Reason:');
        console.error(reason);
        process.exit(1);
    })
    .then((canvas) => {
        const src = canvas.pngStream();
        const dest = fs.createWriteStream(OUT_PATH);
        src.pipe(dest);
        console.info('Packed image `' + OUT_PATH + '` was successfully created!');
    }, (reason) => {
        console.error('[ERROR]: Failed to pack images... Reason:');
        console.error(reason);
        process.exit(1);
    });
}