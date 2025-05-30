# minipp

Quickly help you find unused files in your project to slim down your codebase.

> [!WARNING]
>
> ⚠️  At present, it only supports scanning TS projects or front-end react+ts engineering projects, considering that it only targets the source code files and ignores the project configuration files, so it will not scan files and folders outside the src directory. Need node version >=20.

## Features

### Supported File Types
- TypeScript: `.ts`, `.tsx`
- Style files: `.css`, `.less`, `.scss`
- Media files: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.mp3`, `.mp4`, `.wav`, `.woff`, `.woff2`, `.ttf`, `.eot`, `.json`

### Supported Dependencies
1. **TypeScript/TSX Files**:
   - ES Module `import` statements
   - Static import paths
   - Relative path imports
   - TypeScript path aliases (e.g., `@/*`) // Supported by default
   - Support for `import()` dynamic imports

2. **Style Files**:
   - `@import` statements
   - Resource references in `url()` functions
   - Relative path references
   - Path alias references


### Support profiles

Create a new item in the root directory of the project: `minipp.config.ts`
```ts
import { defineMinippConfig } from 'minipp'

export default defineMinippConfig({
  ignoreFiles: ['src/index.ts', 'src/core/cli/index.ts'],
  ignoreDependencies: ['@types/node'],
})
```

Matching rules are also supported.
```ts
export default defineMinippConfig({
   needDel: false,
   ignoreFiles: ['src/index.ts', 'src/core/**'],
   ignoreDependencies: ['@types*'],
})
```

### Support for deleting unused files and package.json dependencies (deleted files will be backed up)

![2025-05-25 01.51.52.png](https://s2.loli.net/2025/05/25/wcufp4lN5mXM9vb.png)

## Advantages

1. **High Performance**:
   - Extremely fast analysis speed even for large-scale projects
   - Optimized file scanning algorithm
   - Efficient memory usage

2. **Comprehensive Analysis**:
   - Supports multiple file types (TypeScript, JavaScript, CSS, media files)
   - Handles various import methods and path aliases
   - Detailed JSON report output

3. **Developer Friendly**:
   - Simple command-line interface
   - Clear and detailed output format
   - Easy to integrate into existing workflows

4. **Project Optimization**:
   - Helps identify and remove unused files
   - Reduces project size
   - Improves codebase maintainability

## Limitations

### Unsupported Import Methods
1. **Dynamic Imports**:
   - Template string paths not supported
   - Conditional imports not supported

2. **CommonJS Modules**:
   - `require()` syntax not supported
   - Webpack-specific syntax like `require.context()` not supported
   - `module.exports` and `exports` not supported

3. **Path Resolution**:
   - Runtime dynamically concatenated paths not supported
   - Custom path aliases not supported (currently automatically supports paths starting with "@/" which resolves to src directory)
   - Complex path mapping rules (like multiple wildcards) not supported

4. **Special Syntax**:
   - CSS-in-JS style references not supported
   - Vue single-file component dependency resolution not supported

### Other Limitations
1. **Performance Considerations**:
   - Large projects may require longer processing time
   - Memory usage increases with project size

2. **Accuracy**:
   - For files that are automatically loaded at runtime in engineering projects (without explicit import usage), the parser cannot determine if the file is being used (currently categorized as unused files). Users need to determine whether to delete these files based on their framework.

## Installation

### npm
```bash
npm install minipp -D
```
### yarn
```bash
yarn add minipp -D
```
### pnpm
```bash
pnpm add minipp -D
```


### Create a `minipp.config.ts` at the root of the project

```ts
import { defineMinippConfig } from 'minipp'

export default defineMinippConfig({
  ignoreFiles: ['src/index.ts', 'src/core/cli/index.ts'],
  ignoreDependencies: ['@types/node'],
})
```

Matching rules are also supported.
```ts
export default defineMinippConfig({
   needDel: false,
   ignoreFiles: ['src/index.ts', 'src/core/**'],
   ignoreDependencies: ['@types*'],
})
```

Of course, you can also use it globally.

```shell
npm install minipp -g
```
But don't forget to create `minipp.config.ts` in the root directory of the target project.

## Usage

### Basic Usage (execute in project root directory)
```bash
minipp
```

### Specify Project Path
```bash
minipp /path/to/your/project
```

## TypeScript Path Mapping Support

### Supported Configuration
1. **Path Aliases**:
```json
{
   "compilerOptions": {
      "baseUrl": ".",
      "paths": {
         "@/*": ["./src/*"] // Supported by default
      }
   }
}
```

2. **Usage Examples**:
```typescript
// Relative path imports
import { Button } from './components/Button';
import { Button } from '../../components/Button';
import { Button } from '../components/Button';

// Path alias imports
import { utils } from '@/utils'; // will be recognized as "src/utils"
import { config } from '@config/settings'; //will be identified as an external dependency rather than an on-premises resource

// Import from baseUrl
import { types } from 'types';
```

### Path Resolution Rules
1. `@/utils` -> `src/utils`
2. `./utils` -> recognized as a file relative to the current file directory
3. `../utils` -> recognized as a file one level up from the current file directory. `'../../utils', '..'` are also supported

## Output Files

### JSON Report
- Import information from code files
- Import information from css, less, scss files
- Information about unused files
- Unused dependencies in your code
- Dependencies that have been used in the code

Example:

```json
{
   "jsLikePathImports": [
      "src/core/processors/js-like.ts",
      "src/core/processors/style-like.ts",
      "src/core/common/index.ts",
      "src/core/cli/index.ts",
      "src/core/visitor/index.ts"
   ],
   "jsLikeDependenceImports": [
      "fs",
      "path",
      "glob",
      "yocto-spinner",
      "util",
      "@swc/core"
   ],
   "styleLikeImports": [],
   "unusedFile": [
      "src/index.ts"
   ],
   "codeUnusedDependencies": [
      "@swc/cli",
      "@types/node",
      "@typescript-eslint/eslint-plugin",
      "@typescript-eslint/parser",
      "changelogen",
      "eslint",
      "prettier",
      "tsconfig-paths",
      "tsx",
      "typescript",
      "unbuild"
   ]
}
```

## Notes

1. It is recommended to run in the project root directory

## Future Plans

1. Support for js, jsx parsing
2. Support for Vue single-file components 