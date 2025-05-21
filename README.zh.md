# minipp

快速帮你找到项目中没有被使用的文件，为你的项目瘦身。

⚠️目前仅支持扫描前端react+ts工程化项目，考虑到仅针对源代码文件，忽略项目配置文件，所以不会扫描src目录之外的文件及文件夹。

## 功能特点

### 支持的文件类型
- TypeScript/JavaScript: `.ts`, `.tsx`, `.js`, `.jsx`
- 样式文件: `.css`, `.less`, `.scss`
- HTML: `.html`
- 媒体文件: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.ico`, `.webp`

### 支持的依赖关系
1. **JavaScript/TypeScript 文件**:
   - ES Module 的 `import` 语句
   - 静态导入路径
   - 相对路径导入
   - TypeScript 路径别名（如 `@/*`）

2. **HTML 文件**:
   - `<script src="...">` 标签
   - `<link href="...">` 标签
   - `<img src="...">` 标签
   - 相对路径引用
   - 路径别名引用

3. **样式文件**:
   - `@import` 语句
   - `url()` 函数中的资源引用
   - 相对路径引用
   - 路径别名引用

### 配置选项
- 可配置忽略的目录
- 可自定义支持的文件类型
- 可指定项目根目录
- 可指定 TypeScript 配置文件路径

## 使用限制

### 不支持的导入方式
1. **动态导入**:
   - 不支持 `import()` 动态导入
   - 不支持模板字符串形式的路径
   - 不支持条件导入

2. **CommonJS 模块**:
   - 不支持 `require()` 语法
   - 不支持 `require.context()` 等 webpack 特有语法
   - 不支持 `module.exports` 和 `exports`

3. **路径解析**:
   - 不支持运行时动态拼接的路径
   - 不支持 webpack 的路径别名（alias）
   - 不支持复杂的路径映射规则（如多重通配符）

4. **特殊语法**:
   - 不支持 CSS Modules 的 `:global` 和 `:local` 语法
      - 无法正确解析 `:global(.className)` 和 `:local(.className)` 中的类名引用
      - 不会影响 `url()` 函数中的资源引用（如图片、字体等）
      - 可能导致样式类名依赖关系不完整
      - 建议使用普通的 CSS 类名或考虑使用 CSS-in-JS 方案
   - 不支持 CSS-in-JS 的样式引用
   - 不支持 Vue 单文件组件的依赖解析

### 其他限制
1. **性能考虑**:
   - 大项目可能需要较长的处理时间
   - 内存使用量随项目规模增长

2. **准确性**:
   - 可能存在误报或漏报的情况
   - 不支持复杂的构建时配置

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

### HTML 报告
- 交互式可视化界面
- 支持节点拖拽和缩放
- 显示文件依赖关系
- 悬停显示详细信息
- 显示原始路径和解析后的路径

### JSON 报告
- 完整的依赖关系数据
- 包含正向和反向依赖
- 文件类型信息
- 相对路径引用
- 路径别名解析结果

## 注意事项

1. 建议在项目根目录运行
2. 确保有足够的磁盘空间存储报告文件
3. 对于大型项目，建议先使用 `--ignore` 排除不必要的目录
4. 如果遇到内存问题，可以分批处理不同的目录
5. 确保 `tsconfig.json` 中的路径映射配置正确

## 未来计划

1. 支持 CommonJS 模块系统
2. 支持动态导入解析
3. 支持 webpack 路径别名
4. 支持更复杂的路径映射规则
5. 支持 CSS Modules
6. 支持 Vue 单文件组件
7. 优化大项目处理性能 