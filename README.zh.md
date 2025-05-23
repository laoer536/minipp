# minipp

快速帮你找到项目中没有被使用的文件，为你的项目瘦身。

> [!WARNING]
>
> ⚠️  目前仅支持扫描TS项目或者前端react+ts工程化项目，考虑到仅针对源代码文件，忽略项目配置文件，所以不会扫描src目录之外的文件及文件夹。

## 功能特点

### 支持的文件类型
- TypeScript/JavaScript: `.ts`, `.tsx`
- 样式文件: `.css`, `.less`, `.scss`
- 媒体文件等: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.mp3`, `.mp4`, `.wav`, `.woff`, `.woff2`, `.ttf`，`.eot`, `.json`

### 支持的依赖关系
1. **TypeScript/TSX 文件**:
   - ES Module 的 `import` 语句
   - 静态导入路径
   - 相对路径导入
   - TypeScript 路径别名（如 `@/*`）// 默认支持
   - 支持 `import()` 动态导入


2. **样式文件**:
   - `@import` 语句
   - `url()` 函数中的资源引用
   - 相对路径引用
   - 路径别名引用

## 优势

1. **高性能**：
   - 即使在大型项目中也能保持极快的分析速度
   - 优化的文件扫描算法
   - 高效的内存使用

2. **全面的分析能力**：
   - 支持多种文件类型（TypeScript、JavaScript、CSS、媒体文件等）
   - 处理各种导入方法和路径别名
   - 详细的 JSON 报告输出

3. **开发者友好**：
   - 简单的命令行界面
   - 清晰详细的输出格式
   - 易于集成到现有工作流程

4. **项目优化**：
   - 帮助识别和删除未使用的文件
   - 减小项目体积
   - 提高代码库的可维护性

## 使用限制

### 不支持被分析的的导入方式
1. **动态导入**:
   - 不支持模板字符串形式的路径
   - 不支持条件导入

2. **CommonJS 模块**:
   - 不支持 `require()` 语法
   - 不支持 `require.context()` 等 webpack 特有语法
   - 不支持 `module.exports` 和 `exports`

3. **路径解析**:
   - 不支持运行时动态拼接的路径
   - 不支持 自定义的路径别名（alias）（目前自动支持以"@/"开头的路径，会以src目录解析）
   - 不支持复杂的路径映射规则（如多重通配符）

4. **特殊语法**:
   - 不支持 CSS-in-JS 的样式引用
   - 不支持 Vue 单文件组件的依赖解析

### 其他限制
1. **准确性**:
   - 对于工程化项目运行时自动解析加载的文件（没有明确指定被导入使用），解析器不能确定该文件是否被使用（目前统一归类在未被使用的文件中），需要使用者根据自己的框架确定是否需要删除。

## 下载
```bash
npm install minipp -g
```

## 使用方法

### 基本用法（在项目根目录下执行）
```bash
minipp
```

### 指定项目路径
```bash
minipp /path/to/your/project
```

### 配置忽略目录 (后续支持)
```bash
minipp --ignore node_modules,dist,coverage
```

### 配置支持的文件类型 (后续支持)
```bash
minipp --extensions ts,tsx,js,jsx,css
```

### 组合使用
```bash
minipp /path/to/your/project --ignore node_modules,dist --extensions ts,tsx,js,jsx
```

## TypeScript 路径映射支持

### 支持的配置
1. **路径别名**:
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

2. **使用示例**:
```typescript
// 相对路径导入
import { Button } from './components/Button';
import { Button } from '../../components/Button';
import { Button } from '../components/Button';

// 路径别名导入
import { utils } from '@/utils'; // will be recognized as "src/utils"
import { config } from '@config/settings'; //will be identified as an external dependency rather than an on-premises resource

// 从 baseUrl 导入
import { types } from 'types';
```

### 路径解析规则
1. `@/utils` -> `src/utils`
2. `./utils` -> 识别为相对于当前文件目录的文件
3. `../utils` -> 识别为相对于当前文件目录上一级的文件 `'../../utils', '..'`依然支持


## 输出文件


### JSON 报告
- 代码文件中涉及的导入信息
- css,less,scss样式文件中涉及的导入信息
- 未被使用的文件信息
- 代码中未使用的依赖
- 代码中已使用的依赖

示例：

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

## 注意事项

1. 建议在项目根目录运行

## 未来计划

1. 支持 js，jsx解析
2. 支持 Vue 单文件组件