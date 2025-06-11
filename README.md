# minipp

Quickly identify unused files in your project to help slim down your codebase.

中文文档：https://github.com/laoer536/minipp/blob/main/README.zh.md

> [!WARNING]
>
> ⚠️  Currently, only TypeScript projects or frontend React+TS projects are supported. Since the tool focuses on source code files and ignores project configuration files, it will not scan files or folders outside the `src` directory. Requires Node.js version >= 20 to run.

## Features

### Supported File Types
- TypeScript: `.ts`, `.tsx`
- Style files: `.css`, `.less`, `.scss`
- Media files: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.mp3`, `.mp4`, `.wav`, `.woff`, `.woff2`, `.ttf`, `.eot`, `.json`

### Supported Dependency Relationships
1. **TypeScript/TSX Files**:
   - ES Module `import` statements
   - Static import paths
   - Relative path imports
   - TypeScript path aliases (e.g., `@/*`) // Supported by default
   - Dynamic `import()` statements

2. **Style Files**:
   - `@import` statements
   - Resource references in `url()` functions
   - Relative path references
   - Path alias references

### Configuration File Support

Create a `minipp.config.ts` file in the project root:
```ts
import { defineMinippConfig } from 'minipp'

export default defineMinippConfig({
  ignoreFiles: ['src/index.ts', 'src/core/cli/index.ts'],
  ignoreDependencies: ['@types/node'],
})
```

Glob patterns are also supported:
```ts
export default defineMinippConfig({
   needDel: false,
   ignoreFiles: ['src/index.ts', 'src/core/**'],
   ignoreDependencies: ['@types*'],
})
```

### Supports Deleting Unused Files and Removing Unused Dependencies from `package.json` (Backups are saved in the `minipp-delete-files` folder)

![2025-05-25 01.51.52.png](https://s2.loli.net/2025/05/25/wcufp4lN5mXM9vb.png)

## Advantages

1. **High Performance**:
   - Fast analysis even in large projects
   - Optimized file scanning algorithm
   - Efficient memory usage

2. **Comprehensive Analysis**:
   - Supports multiple file types (TypeScript, TSX, CSS, media files, etc.)
   - Handles various import methods and path aliases
   - Detailed JSON report output

3. **Developer-Friendly**:
   - Simple command-line interface
   - Clear and detailed output format
   - Easy integration into existing workflows

4. **Project Optimization**:
   - Identifies and removes unused files
   - Reduces project size
   - Improves codebase maintainability

## Limitations

### Unsupported Import Methods
1. **Dynamic Imports**:
   - Template string paths are not supported
   - Conditional imports are not supported

2. **CommonJS Modules**:
   - `require()` syntax is not supported
   - Webpack-specific syntax like `require.context()` is not supported
   - `module.exports` and `exports` are not supported

3. **Path Resolution**:
   - Runtime dynamically constructed paths are not supported
   - Custom path aliases (other than `@/`) are not supported (default `@/` is resolved to `src/`)
   - Complex path mapping rules (e.g., multiple wildcards) are not supported

4. **Special Syntax**:
   - CSS-in-JS style references are not supported
   - Vue single-file component dependency resolution is not supported

### Other Limitations
1. **Accuracy**:
   - For files loaded automatically at runtime (without explicit imports in code), the tool cannot determine if they are used (currently classified as unused). Users must manually verify such files before deletion.

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

### Create `minipp.config.ts` in the Project Root

```ts
import { defineMinippConfig } from 'minipp'

export default defineMinippConfig({
  ignoreFiles: ['src/index.ts', 'src/core/cli/index.ts'],
  ignoreDependencies: ['@types/node'],
})
```

Glob patterns are also supported:

```ts
export default defineMinippConfig({
   needDel: false,
   ignoreFiles: ['src/index.ts', 'src/core/**'],
   ignoreDependencies: ['@types*'],
})
```

You can also install it globally:

```shell
npm install minipp -g
```
Don't forget to create `minipp.config.ts` in the target project's root directory.

## Usage

### Basic Usage (Run in the project root)
```bash
minipp
```

### Specify Project Path
```bash
minipp /path/to/your/project
```

## TypeScript Path Mapping Support

### Supported Configurations
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
import { utils } from '@/utils'; // Resolved as "src/utils"
import { config } from '@config/settings'; // Treated as an external dependency, not a local resource

// BaseUrl imports
import { types } from 'types';
```

### Path Resolution Rules
1. `@/utils` -> `src/utils`
2. `./utils` -> Resolved relative to the current file's directory
3. `../utils` -> Resolved relative to the parent directory of the current file (supports `'../../utils', '..'`, etc.)

## Output Files

### JSON Report
- Import information in code files
- Import information in CSS/LESS/SCSS files
- Unused file information
- Unused dependencies in code
- Used dependencies in code

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

1. It is recommended to run the tool in the project root directory.

## Future Plans

1. Support for JavaScript and JSX parsing
2. Support for Vue single-file components