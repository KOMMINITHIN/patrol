# PWA Icons

This folder should contain the following PNG icons for the PWA:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## How to Generate Icons

1. **Online Tool (Recommended)**
   - Go to https://www.pwabuilder.com/imageGenerator
   - Upload the `../favicon.svg` file
   - Download the generated icons

2. **Using ImageMagick (Command Line)**
   ```bash
   for size in 72 96 128 144 152 192 384 512; do
     convert ../favicon.svg -resize ${size}x${size} icon-${size}x${size}.png
   done
   ```

3. **Using Sharp (Node.js)**
   ```javascript
   const sharp = require('sharp');
   const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
   
   sizes.forEach(size => {
     sharp('../favicon.svg')
       .resize(size, size)
       .png()
       .toFile(`icon-${size}x${size}.png`);
   });
   ```

## Temporary Placeholders

For development, the Vite PWA plugin will work without actual PNG files.
The SVG files in this folder can be used as references for icon design.
