# A simple Node.js image resize service (TypeScript)

A modernized TypeScript version of the image resize service with updated dependencies.

## Config

- `appPort` The port the server will be listening on
- `appStdOut` Set to `false` to prevent stdout logging
- `convertCmd` Path to imagemagick's `convert`
- `cacheDirectory` Directory to save converted images to

## Libraries

### Runtime Dependencies

- **express** (^4.19.2) - Fast, unopinionated, minimalist web framework for Node.js. Used to handle HTTP requests and routing.
- **pug** (^3.0.3) - High-performance template engine (formerly Jade). Used for rendering the help page HTML.
- **axios** (^1.7.7) - Promise-based HTTP client for Node.js. Used to fetch remote images and validate source URLs.

### Development Dependencies

- **typescript** (^5.5.3) - TypeScript compiler that adds static typing to JavaScript. Compiles TypeScript source code to JavaScript.
- **ts-node** (^10.9.2) - TypeScript execution and REPL for Node.js. Allows running TypeScript files directly without pre-compilation during development.
- **@types/*** - TypeScript type definitions for various libraries (express, node, chai, mocha, sinon). Provides type safety and IntelliSense.
- **mocha** (^10.6.0) - Feature-rich JavaScript test framework. Used as the test runner for unit tests.
- **chai** (^5.1.1) - BDD/TDD assertion library. Provides assertion functions for tests.
- **sinon** (^18.0.0) - Standalone test spies, stubs and mocks. Used for creating test doubles in unit tests.
- **eslint** (^8.57.0) - Pluggable linting utility for JavaScript and TypeScript. Enforces code quality and style standards.
- **@typescript-eslint/*** - ESLint parser and plugin for TypeScript. Enables linting of TypeScript code.

### External Dependencies

- **ImageMagick** - Command-line image manipulation tool. The `convert` command is required for actual image processing (resizing, cropping, format conversion). Must be installed separately on the system.

## Setup

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Development

```bash
npm run dev
```

### Running Tests

```bash
npm test
npm run test:watch  # Watch mode
```

## Usage

### Method 1: Traditional URL-based (Original)

http://serveraddress/`resize`/`output`/`url`

### Method 2: Blob Storage with Query Parameters - ImageMagick (New)

http://serveraddress/resize/`blobName`/`path`?s=`size`&f=`format`&g=`gravity`&m=`mode`&q=`quality`

This method requires blob storage URLs to be configured via environment variables (see `.env.example`).

**Query Parameters:**
- `s` - Size (optional): Can be `300x300`, `w300`, `h300`, `c300x300`, or just `300` (plain number = width). If omitted, only format conversion is performed.
- `f` - Format (optional): `jpg`, `png`, `webp`, or any ImageMagick-supported format (default: `png`)
- `g` - Gravity (optional): `c`, `n`, `ne`, `e`, `se`, `s`, `sw`, `w`, `nw` (default: `c`)
- `m` - Mode (optional): `resize`, `crop`, or `scale` (default: `resize`)
- `q` - Quality (optional): 0-100 (default: `80`)

**Examples:**
```
# Resize to 300x300 and crop, output as JPG
http://localhost:7071/resize/sample-blob/path/to/image.jpg?s=300x300&f=jpg&g=ne&m=crop&q=90

# Resize width to 500 (proportional height)
http://localhost:7071/resize/sample-blob/path/to/image.jpg?s=500&f=jpg

# Convert format only (no resizing)
http://localhost:7071/resize/sample-blob/path/to/image.jpg?f=png

# Convert HEIC to WebP
http://localhost:7071/resize/sample-blob/path/to/image.heic?f=webp&q=85
```

### Method 3: Blob Storage with Query Parameters - Sharp + HEIC Support (New)

http://serveraddress/media/`blobName`/`path`?s=`size`&f=`format`&g=`gravity`&m=`mode`&q=`quality`

This endpoint uses Sharp library with heic-decode for better HEIC/HEIF support. Same configuration as Method 2.

**Query Parameters:**
- `s` - Size (optional): Can be `300x300`, `w300`, `h300`, `c300x300`, or just `300` (plain number = width). If omitted, only format conversion is performed.
- `f` - Format (optional): `jpg`, `png`, `webp`, `heic`, `heif`, `avif`, `gif` (default: `png`)
- `g` - Gravity (optional): `c`, `n`, `ne`, `e`, `se`, `s`, `sw`, `w`, `nw` (default: `c`)
- `m` - Mode (optional): `resize`, `crop`, or `scale` (default: `resize`)
- `q` - Quality (optional): 0-100 (default: `80`)

**Examples:**
```
# Convert HEIC to WebP with resize
http://localhost:7071/media/sample-blob/path/to/image.heic?s=300x300&f=webp&q=85

# Convert HEIC to PNG (no resize)
http://localhost:7071/media/sample-blob/path/to/image.heic?f=png

# Resize and convert to AVIF
http://localhost:7071/media/sample-blob/path/to/image.jpg?s=800x600&f=avif&q=90
```

**Key Differences:**
- `/resize` - Uses ImageMagick (requires libheif for HEIC support)
- `/media` - Uses Sharp with heic-decode (native HEIC/HEIF support, faster processing)

**Configuration:**
Set blob storage URLs in environment variables:
```bash
BLOB_URL_SAMPLE_BLOB=example.blob.core.windows.net
```

### Method 4: POST /media - Upload and Process Images (New)

Upload image files directly with JWT authentication.

**Authentication:**

First, get a JWT token from the `/auth` endpoint:

```bash
# POST /auth with Basic Auth
curl -X POST http://localhost:7071/auth \
  -H "Authorization: Basic $(echo -n 'my_client:my-secret' | base64)"

# Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expiresIn": 890
}
```

**Upload and Process:**

```bash
# POST /media with Bearer token and query params
curl -X POST "http://localhost:7071/media?s=300x300&f=webp&q=85" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @/path/to/image.jpg \
  --output result.webp
```

**Query Parameters:**
- `s` - Size (optional): Can be `300x300`, `w300`, `h300`, or just `300` (plain number = width)
- `f` - Format (optional): `jpg`, `png`, `webp`, `heic`, `heif`, `avif`, `gif` (default: `png`)
- `q` - Quality (optional): 0-100 (default: `80`)

**Environment Variables:**
```bash
# JWT Configuration
jwt_secret_key=your-secret-key-here
jwt_expire_time=900

# Client Credentials (format: <CLIENT_ID>_auth_client=<CLIENT_SECRET>)
my_client_auth_client=my-secret
```

**Examples:**
```bash
# Convert HEIC to WebP
curl -X POST "http://localhost:7071/media?f=webp" \
  -H "Authorization: Bearer $TOKEN" \
  --data-binary @image.heic -o output.webp

# Resize to 500x500 and convert to PNG
curl -X POST "http://localhost:7071/media?s=500x500&f=png" \
  -H "Authorization: Bearer $TOKEN" \
  --data-binary @image.jpg -o output.png
```

### Options (Traditional Method)

**`resize`**

- `width`x`height` stretch to dimensions
- c`width`x`height`[`gravity`] crop to dimensions with optional gravity
  Default `gravity` is `c` for center
  Choices include `c`, `n`, `ne`, `e`, `se`, `s`, `sw`, `w`, `nw`
- h`height`, h160: scale proportional to height
- w`width`, w120: scale proportional to width

**`output`**

- `format`
  Default `format`is `jpg`
  Choices include `jpg` and `png`
- `jpg`,`quality`
  Optional quality setting for `jpg` format (Defaults to 80)

**`url`**

- A valid URL to the source image to be resized

### Examples

`http://serveraddress/120x160/jpg/http://domain.com/image.jpg`
`http://serveraddress/c300x300/jpg/http://domain.com/image.jpg`
`http://serveraddress/c300x300n/jpg/http://domain.com/image.jpg`
`http://serveraddress/h300/jpg/http://domain.com/image.jpg`
`http://serveraddress/w300/jpg,100/http://domain.com/image.jpg`

## Changes from Original

- Converted to TypeScript with full type definitions
- Updated Express from 3.x to 4.x
- Replaced deprecated `request` library with `axios`
- Replaced deprecated `Q` promises with native async/await
- Replaced Jade with Pug (same syntax, updated package)
- Updated all dependencies to latest versions
- Modernized test framework (Mocha + Chai with TypeScript support)
- Added ESLint for code quality

## License

(MIT License)

Copyright (c) 2013 Thorsten Basse

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
