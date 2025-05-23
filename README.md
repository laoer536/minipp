# minipp

Quickly help you find unused files in your project to slim down your codebase.

⚠️ Currently only supports scanning frontend React+TS engineering projects. Considering that it only targets source code files and ignores project configuration files, it will not scan files and folders outside the src directory.

## Features

### Supported File Types
- TypeScript/JavaScript: `.ts`, `.tsx`
- Style files: `.css`, `.less`, `.scss`
- Media files: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.mp3`, `.mp4`, `.wav`, `.woff`, `.woff2`, `.ttf`, `.eot`, `.json`

### Supported Dependencies
1. **JavaScript/TypeScript Files**:
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
```bash
npm install minipp -g
```

## Usage

### Basic Usage (execute in project root directory)
```bash
minipp
```

### Specify Project Path
```bash
minipp /path/to/your/project
```

### Configure Ignored Directories (coming soon)
```bash
minipp --ignore node_modules,dist,coverage
```

### Configure Supported File Types (coming soon)
```bash
minipp --extensions ts,tsx,js,jsx,css
```

### Combined Usage
```bash
minipp /path/to/your/project --ignore node_modules,dist --extensions ts,tsx,js,jsx
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

Example:

```json
{
  "jsLikeImports": [
    "src/core/processors/js-like.ts",
    "src/core/processors/style-like.ts",
    "fs",
    "path",
    "glob",
    "src/core/common/index.ts",
    "yocto-spinner",
    "util",
    "src/core/cli/index.ts",
    "@swc/core",
    "src/core/visitor/index.ts"
  ],
  "styleLikeImports": [],
  "unusedFile": [
    "src/index.ts"
  ]
}
```

## Notes

1. It is recommended to run in the project root directory

## Future Plans

1. Support for js, jsx parsing
2. Support for analyzing unused external dependencies
3. Support for Vue single-file components 