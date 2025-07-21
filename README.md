# paint-by-numbers-generator

A TypeScript library for generating "paint by numbers" patterns from images. Quantize images, build color facets, and prepare your own paint-by-numbers templates with ease.

---

## Introduction

This library is converted from the original [paintbynumbersgenerator](https://github.com/drake7707/paintbynumbersgenerator) demo into a standalone, reusable package.

---

## Installation (Local Development)

This project is not published to npm yet. To use it in your own local projects, follow these steps with [`npm link`](https://docs.npmjs.com/cli/v10/commands/npm-link):

### 1. In this library's folder:

```bash
npm install
npm run build
npm link
```

### 2. In your consuming project:

```bash
npm link udo-paint-by-numbers-generator
```

> Replace `udo-paint-by-numbers-generator` with the exact name in this project's `package.json` if you changed it.

### 3. Use it in your code:

```typescript
import { quantizeImage, buildFacets } from 'udo-paint-by-numbers-generator';
// ...use as below!
```

#### Notes
- Any changes you make to this library and rebuild will be reflected in your consuming project immediately.
- If you want to remove the link, use `npm unlink udo-paint-by-numbers-generator` in your project.

---

## Usage

> Coming soon

---

## License

MIT

---

## Acknowledgements

This library is based on the excellent work of [drake7707/paintbynumbersgenerator](https://github.com/drake7707/paintbynumbersgenerator).
Special thanks to all contributors to the original project!

---
