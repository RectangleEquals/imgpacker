var fs = require('fs');
const path = require('path');
const readChunk = require('read-chunk');
const imageType = require('image-type');
const isSvg = require('is-svg');
const sharp = require('sharp');
const createCollage = require("photo-collage");
const { version } = require('./package.json');

// Internal application constants
const MIN_ARG_COUNT = 3;
const MIN_COLUMNS = 1;
const MIN_CELL_SIZE = 4;
const INPUT_QUALITY = 100;

// ANSI Escape Sequences
const AES_RESET = '\u001b[0m';
const AES_BOLD = '\u001b[1m';
const AES_DKGREEN = '\u001b[32m';
const AES_RED = '\u001b[91m';
const AES_GREEN = '\u001b[92m';
const AES_YELLOW = '\u001b[93m';
const AES_WHITE = '\u001b[97m';

var args = process.argv.slice(2);
//console.debug('[args]: ', args);
if(args.length < MIN_ARG_COUNT) {
    if(args.length > 0)
        console.error(AES_RED + AES_BOLD + 'Invalid number of arguments' + AES_RESET);
    showUsage();
}

// Application arguments
const CELL_SIZE = parseInt(args[args.length - 4]);
const MAX_COLUMNS = parseInt(args[args.length - 3]);
const OUT_PATH = args[args.length - 2];
const IN_PATH = args[args.length - 1] || process.cwd();
const IN_PATH_INFO = path.parse(IN_PATH);
const OUT_PATH_INFO = path.parse(OUT_PATH);
var appOptions = {};

// Validate CellSize argument
if(CELL_SIZE < MIN_CELL_SIZE) {
    console.error(AES_RED + AES_BOLD + 'CellSize must be at least ' + MIN_CELL_SIZE.toString() + AES_RESET);
    process.exit(1);
}

// Validate Columns argument
if(MAX_COLUMNS < MIN_COLUMNS) {
    console.error(AES_RED + AES_BOLD + 'Columns must be at least ' + MIN_COLUMNS.toString() + AES_RESET);
    process.exit(1);
}

// Validate InputFolder argument
//console.debug('\t- [root]: `' + IN_PATH_INFO.root + '`\n\t- [dir]: `' + IN_PATH_INFO.dir + '`\n\t- [base]: `' + IN_PATH_INFO.base + '`');
if(IN_PATH_INFO.root.length < 1 || IN_PATH_INFO.dir.length < 1 || !fs.existsSync(IN_PATH))
{
    console.error(AES_RED + AES_BOLD + 'Invalid InputFolder path: `' + IN_PATH + '`' + AES_RESET);
    process.exit(1);
}

// Validate OutputFile argument
if(!fs.existsSync(OUT_PATH_INFO.dir)) {
    console.error(AES_RED + AES_BOLD + 'Invalid OutputFile path: `' + OUT_PATH_INFO.dir + '`' + AES_RESET);
    process.exit(1);
}

// Validate Options
for(var i = 0; i < args.length - 4; i++)
{
    let strOption = args[i].replace(/-/g, '');
    if(args[i].startsWith('-') && !args[i].startsWith('---'))
    {

        // Blur
        if(strOption === 'bb' || strOption === 'blurBefore')
            { appOptions.blurBefore = true; continue; }
        if(strOption === 'ba' || strOption === 'blurAfter')
            { appOptions.blurAfter = true; continue; }
        
        // Sharpen
        if(strOption === 'sb' || strOption === 'sharpenBefore')
            { appOptions.sharpenBefore = true; continue; }
        if(strOption === 'sa' || strOption === 'sharpenAfter')
            { appOptions.sharpenAfter = true; continue; }
        
        // Median
        if(strOption === 'mb' || strOption === 'medianBefore')
            { appOptions.medianBefore = true; continue; }
        if(strOption === 'ma' || strOption === 'medianAfter')
            { appOptions.medianAfter = true; continue; }
                
        // Flip
        if(strOption === 'fy' || strOption === 'flip')
            { appOptions.flip = true; continue; }

        // Flop
        if(strOption === 'fx' || strOption === 'flop')
            { appOptions.flop = true; continue; }

        // Flatten
        if(strOption === 'fl' || strOption === 'flatten')
            { appOptions.flatten = true; continue; }

        console.warn(AES_YELLOW + 'Invalid option: ' + AES_RESET + strOption);
    } else {
        console.warn(AES_YELLOW + 'Invalid option: ' + AES_RESET + strOption);
    }
}

// Build a list of supported images from InputFolder
fs.readdir(IN_PATH, function(err, files)
{
    if(err) {
        console.error(AES_BOLD + AES_RED);
        console.error(err);
        console.error(AES_RESET);
        process.exit(1);
    }

    var supportedImages = [];
    for (var i = 0; i < files.length; i++) {
        let filePath = validatePath(files[i]);
        let stat = fs.statSync(filePath);
        if(!stat.isFile())
            continue;
        if(isSupportedImageFile(filePath))
            supportedImages.push(filePath);
        else
            console.warn(AES_YELLOW + '[SKIPPED]:' + AES_RESET + '`' + filePath + '` (unsupported file format)');
    }
    if(supportedImages.length < 1) {
        console.error(AES_RED + AES_BOLD + 'Failed to find any supported images in `' + IN_PATH + '`' + AES_RESET);
        process.exit(1);
    }

    // Sort and process all supported images
    processImages(supportedImages.sort());
});

// Show usage information, and exit
function showUsage() {
    console.info(AES_BOLD + AES_GREEN + 'Image Packer v' + version + AES_RESET);
    console.info(AES_DKGREEN + 'Authored by: Michael Wion (https://github.com/RectangleEquals)' + AES_RESET);
    console.info(AES_BOLD + AES_WHITE + 'Usage: imgpacker [Options] <CellSize> <Columns> <OutputFile> [InputFolder]');
    console.info(AES_RESET);
    console.info(AES_WHITE + 'Example: imgpacker --sharpenAfter 32 10 "C:\\OutputImage.png" "C:\\Images"');
    console.info(AES_RESET + '\tCopies all images found in "C:\\Images", resizes them to 32x32px, sharpens them, tiles them into 10 max columns, and saves the result to "C:\\OutputImage.png"');
    console.info(AES_WHITE);
    console.info('Options:');
    console.info('\t-ba, --blurAfter\t\tBlurs input images AFTER resizing.');
    console.info('\t-bb, --blurBefore\t\tBlurs input images BEFORE resizing.');
    console.info('\t-sa, --sharpenAfter\t\tSharpens input images AFTER resizing.');
    console.info('\t-sb, --sharpenBefore\t\tSharpens input images BEFORE resizing.');
    console.info('\t-ma, --medianAfter\t\tApplies a median filter to input images AFTER resizing.');
    console.info('\t-mb, --medianBefore\t\tApplies a median filter to input images BEFORE resizing.');
    console.info('\t-fy, --flip\t\t\tFlip the image about the vertical Y axis.');
    console.info('\t-fx, --flop\t\t\tFlop the image about the horizontal X axis.');
    console.info('\t-fl, --flatten\t\t\tMerge alpha transparency channel, if any, with a background.');
    console.info(AES_RESET);
    process.exit(0);
}

// Helper function to make sure we have a valid, absolute path 
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
        result.mime === 'image/png'  ||
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

    // Apply filters/transformations to input images
    var buffers = [];
    imagePaths.forEach(imgPath =>
    {
        var pathInfo = path.parse(imgPath);
        var pngImage = sharp(imgPath).png(pngOptions);
        pngImage.metadata().then(metadata =>
        {
            ////////////////////////
            // Pre-resize operations
            ////////////////////////

            // Flatten
            if(appOptions.flatten)
                pngImage = pngImage.flatten();

            // Blur
            if(appOptions.blurBefore)
                pngImage = pngImage.blur();

            // Sharpen
            if(appOptions.sharpenBefore)
                pngImage = pngImage.sharpen();

            // Median
            if(appOptions.medianBefore)
                pngImage = pngImage.median();
            
            // Flip
            if(appOptions.flip)
                pngImage = pngImage.flip();
            
            // Flop
            if(appOptions.flop)
                pngImage = pngImage.flop();

            pngImage = pngImage.resize(CELL_SIZE, CELL_SIZE);

            /////////////////////////
            // Post-resize operations
            /////////////////////////

            // Blur
            if(appOptions.blurAfter)
                pngImage = pngImage.blur();

            // Sharpen
            if(appOptions.sharpenAfter)
                pngImage = pngImage.sharpen();

            // Median
            if(appOptions.medianBefore)
                pngImage = pngImage.median();

            pngImage.toBuffer()
            .then((buffer) => {
                buffers.push(buffer);
                index++;
                console.info('[Processed]: ' + index.toString() + ' of ' + imagePaths.length.toString() + ' (' + (Math.round((index / imagePaths.length) * 100)).toString() + '%)');
                // If this is the final image in the list, tile all of the images into one
                if(index == imagePaths.length)
                    packImages(buffers, rows);
            }, (reason) => {
                console.error(AES_RED + AES_BOLD + 'Failed to create buffer for `' + pathInfo.base + '`... Reason:');
                console.error(reason);
                console.error(AES_RESET);
                process.exit(1);
            });
        }, reason => {
            console.error(AES_RED + AES_BOLD + 'Failed to get metadata for `' + pathInfo.base + '`... Reason:');
            console.error(reason);
            console.error(AES_RESET);
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
        backgroundColor: 'rgba(0,0,0,0)' // transparent background
    };
    
    createCollage(options)
    .catch((err) => {
        console.error(AES_RED + AES_BOLD + 'Failed to pack images! Reason:');
        console.error(reason);
        console.error(AES_RESET);
        process.exit(1);
    })
    .then((canvas) => {
        const src = canvas.pngStream();
        const dest = fs.createWriteStream(OUT_PATH);
        src.pipe(dest);
        console.info(AES_BOLD + 'Packed image `' + OUT_PATH + '` was successfully created!' + AES_RESET);
    }, (reason) => {
        console.error(AES_RED + AES_BOLD + 'Failed to pack images... Reason:');
        console.error(reason);
        console.error(AES_RESET);
        process.exit(1);
    });
}