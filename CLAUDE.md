# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based Node.js image resize service that processes images on-the-fly via HTTP requests. It uses ImageMagick's `convert` command to resize, scale, and crop images, then caches the results. This is a modernized version with TypeScript, updated dependencies, and async/await patterns.

## Commands

### Building and Running
```bash
npm run build     # Compile TypeScript to JavaScript in dist/
npm start         # Run the compiled server
npm run dev       # Run directly with ts-node (development)
```

### Testing
```bash
npm test          # Run all tests
npm run test:watch # Watch for changes and re-run tests
```

### Development Tools
```bash
npm run watch     # Watch and compile TypeScript changes
npm run lint      # Run ESLint on source files
npm run clean     # Remove dist directory
```

## Architecture

### Request Flow

1. **src/server.ts** - Express 4.x app entry point
   - Sets up routes including health check (`/health`) and help page (`/`)
   - Main resize route matches pattern: `/{resize}/{output}/{url}` (see RequestSplitter.urlMatch)
   - Creates ResizeJob instances using async/await pattern
   - Uses modern Express 4.x middleware (no bodyParser)

2. **src/lib/requestsplitter.ts** - URL parsing and option mapping
   - Parses incoming URLs using static regex pattern to extract resize parameters
   - `urlMatch` regex captures: action (crop/width/height), dimensions, gravity, format, quality, and source URL
   - `mapOptions()` transforms URL components into typed `ImageOptions` object
   - Sanitizes quality param to integers 0-100

3. **src/lib/resize.ts** - Core resize logic with async/await
   - `ResizeJob` class handles the entire resize workflow using promises:
     - Generates cache filename from SHA1 hash of options
     - Validates remote source URLs using axios (checks hostname, timeout, status, content-type)
     - Checks cache before processing with `fs.promises`
     - Streams image through ImageMagick convert command
   - Uses streaming pipeline: axios stream → convert stdin → convert stdout → cache file
   - Cache hit returns immediately; cache miss triggers resize
   - Replaces deprecated `request` library with `axios`

4. **src/lib/imagemagickcommand.ts** - ImageMagick command builder
   - Factory function that returns different command builders based on action
   - Uses abstract class with typed options and file paths
   - `CropImageMagickCommand` - crops to exact dimensions with gravity
   - `ScaleImageMagickCommand` - scales to exact dimensions (both width and height provided)
   - `ResizeImageMagickCommand` - resizes proportionally (one dimension provided)
   - Gravity options strongly typed with TypeScript union type

### Key Types (src/lib/imagemagickcommand.ts)

```typescript
export interface ImageOptions {
  action: 'crop' | 'resize' | 'scale';
  width: string;
  height: string;
  gravity: GravityType;
  format: string;
  quality: string;
  imagefile: string;
  url: string;
  suffix: string;
}

export type GravityType = 'nw' | 'n' | 'ne' | 'w' | 'c' | 'e' | 'sw' | 's' | 'se';
```

### Configuration (src/config.ts)

- Strongly typed with TypeScript interfaces
- `appPort` - Server port (default 5060, overridable via PORT env var)
- `convertCmd` - Path to ImageMagick convert binary (default 'convert')
- `cacheDirectory` - Where processed images are stored
- `tmpDirectory` - Temporary file storage
- `cacheHeader` - HTTP cache control settings

### Testing

- Tests written in TypeScript with `.spec.ts` extension
- Uses Mocha + Chai with full type support
- Tests use async/await instead of callbacks
- Run with `ts-node/register` for direct TypeScript execution

### Modern Dependencies

- **express**: 4.x (upgraded from 3.x)
- **pug**: 3.x (replaces jade)
- **axios**: Latest (replaces deprecated request)
- **typescript**: 5.x with strict mode enabled
- Native Promises/async-await (replaces Q library)

### URL Format

```
http://serveraddress/{resize}/{output}/{source-url}
```

**Resize patterns:**
- `WIDTHxHEIGHT` - stretch to dimensions
- `cWIDTHxHEIGHT[GRAVITY]` - crop with optional gravity (default: center)
- `hHEIGHT` - scale proportional to height
- `wWIDTH` - scale proportional to width

**Output patterns:**
- `FORMAT` - jpg or png (default: jpg)
- `FORMAT,QUALITY` - format with quality 0-100 (default: 80)

**Example:** `/c300x300ne/jpg,90/http://example.com/image.jpg`
Crops to 300x300 with northeast gravity, outputs as jpg with quality 90

### Key Differences from Original JavaScript Version

- All files use TypeScript with strict type checking
- Async/await replaces callbacks and Q promises
- Axios replaces deprecated request library
- Express 4.x API (sendFile instead of sendfile, no bodyParser middleware)
- Compiled to dist/ directory before running
- Modern testing setup with TypeScript support
