# minip

A tool for generating dependency trees for frontend projects, capable of creating visual dependency graphs and detailed JSON reports.

## Features

### Supported File Types
- TypeScript/JavaScript: `.ts`, `.tsx`, `.js`, `.jsx`
- Style Files: `.css`, `.less`, `.scss`
- HTML: `.html`
- Media Files: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.ico`, `.webp`

### Supported Dependencies
1. **JavaScript/TypeScript Files**:
   - ES Module `import` statements
   - Static import paths
   - Relative path imports
   - TypeScript path aliases (e.g., `@/*`)

2. **HTML Files**:
   - `<script src="...">` tags
   - `<link href="...">` tags
   - `<img src="...">` tags
   - Relative path references
   - Path alias references

3. **Style Files**:
   - `@import` statements
   - Resource references in `url()` functions
   - Relative path references
   - Path alias references

### Configuration Options
- Configurable ignored directories
- Customizable supported file types
- Specifiable project root directory
- Specifiable TypeScript configuration file path

## Limitations

### Unsupported Import Methods
1. **Dynamic Imports**:
   - No support for `import()` dynamic imports
   - No support for template string paths
   - No support for conditional imports

2. **CommonJS Modules**:
   - No support for `require()` syntax
   - No support for webpack-specific features like `require.context()`
   - No support for `module.exports` and `exports`

3. **Path Resolution**:
   - No support for runtime dynamic path concatenation
   - No support for webpack path aliases
   - No support for complex path mapping rules (e.g., multiple wildcards)

4. **Special Syntax**:
   - No support for CSS Modules `:global` and `:local` syntax
      - Cannot correctly parse class names in `:global(.className)` and `:local(.className)`
      - Does not affect resource references in `url()` functions (images, fonts, etc.)
      - May result in incomplete style class name dependencies
      - Consider using regular CSS class names or CSS-in-JS solutions
   - No support for CSS-in-JS style references
   - No support for Vue single-file component dependency resolution

### Other Limitations
1. **Performance Considerations**:
   - Large projects may require longer processing time
   - Memory usage increases with project size

2. **Accuracy**:
   - May have false positives or false negatives
   - No support for complex build-time configurations

## Usage

### Basic Usage
```bash
npm start
```

### Specify Project Path
```bash
npm start /path/to/your/project
```

### Configure Ignored Directories
```bash
npm start --ignore node_modules,dist,coverage
```

### Configure Supported File Types
```bash
npm start --extensions ts,tsx,js,jsx,css
```

### Specify TypeScript Configuration
```bash
npm start --tsconfig ./tsconfig.json
```

### Combined Usage
```bash
npm start /path/to/your/project --ignore node_modules,dist --extensions ts,tsx,js,jsx --tsconfig ./tsconfig.json
```

## TypeScript Path Mapping Support

### Supported Configuration
1. **Path Aliases**:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@utils/*": ["./src/utils/*"]
    }
  }
}
```

2. **Usage Examples**:
```typescript
// Relative path import
import { Button } from './components/Button';

// Path alias import
import { utils } from '@/utils';
import { config } from '@config/settings';

// Import from baseUrl
import { types } from 'types';
```

### Path Resolution Rules
1. First check if it's a relative path (starts with `.`)
2. Then try to match path mapping rules in `tsconfig.json`
3. Finally try to resolve from `baseUrl`

## Output Files

### HTML Report
- Interactive visualization interface
- Support for node dragging and zooming
- Display of file dependencies
- Hover to show detailed information
- Display of original and resolved paths

### JSON Report
- Complete dependency relationship data
- Includes forward and reverse dependencies
- File type information
- Relative path references
- Path alias resolution results

## Notes

1. Recommended to run in project root directory
2. Ensure sufficient disk space for report files
3. For large projects, consider using `--ignore` to exclude unnecessary directories
4. If encountering memory issues, process directories in batches
5. Ensure correct path mapping configuration in `tsconfig.json`

## Future Plans

1. Support for CommonJS module system
2. Support for dynamic import resolution
3. Support for webpack path aliases
4. Support for more complex path mapping rules
5. Support for CSS Modules
6. Support for Vue single-file components
7. Optimize performance for large projects 