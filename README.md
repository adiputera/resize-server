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

http://serveraddress/`resize`/`output`/`url`

### Options

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
