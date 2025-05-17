import fs from 'fs'
import path from 'path'
import { parse } from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'
import * as t from '@babel/types'

interface DependencyNode {
  path: string
  dependencies: string[] // 该文件引用的其他文件
  dependents: string[] // 引用该文件的其他文件
  type: string
}

interface DependencyTree {
  nodes: DependencyNode[]
  edges: { from: string; to: string }[]
}

interface GeneratorOptions {
  ignoreDirs?: string[] // 要忽略的目录列表
  supportedExtensions?: string[] // 支持的文件扩展名
  tsConfigPath?: string // tsconfig.json 的路径
}

interface PathMapping {
  pattern: RegExp
  paths: string[]
}

class Util {
  private readonly supportedExtensions: string[]
  private readonly ignoreDirs: string[]
  private readonly projectRoot: string
  private readonly tree: DependencyTree = { nodes: [], edges: [] }
  private processedFiles: Set<string> = new Set()
  private pathMappings: PathMapping[] = []
  private baseUrl: string = ''

  constructor(projectRoot: string, options: GeneratorOptions = {}) {
    this.projectRoot = projectRoot
    this.ignoreDirs = options.ignoreDirs || ['node_modules', '.git', 'dist', 'build', '.umi']
    this.supportedExtensions = options.supportedExtensions || [
      'ts',
      'tsx',
      'js',
      'jsx',
      'html',
      'css',
      'less',
      'scss',
      'png',
      'jpg',
      'jpeg',
      'gif',
      'svg',
      'ico',
      'webp',
    ]

    // 初始化路径映射
    this.initializePathMappings(options.tsConfigPath)
  }

  private initializePathMappings(tsConfigPath?: string): void {
    try {
      const configPath = tsConfigPath || path.join(this.projectRoot, 'tsconfig.json')
      if (fs.existsSync(configPath)) {
        const tsConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        const compilerOptions = tsConfig.compilerOptions || {}

        // 设置 baseUrl
        this.baseUrl = compilerOptions.baseUrl
          ? path.resolve(this.projectRoot, compilerOptions.baseUrl)
          : this.projectRoot

        // 解析路径映射
        if (compilerOptions.paths) {
          this.pathMappings = Object.entries(compilerOptions.paths).map(([pattern, paths]) => ({
            pattern: new RegExp('^' + pattern.replace(/\*/g, '.*')),
            paths: Array.isArray(paths) ? paths : [paths],
          }))
        }

        console.log('已加载 TypeScript 路径映射配置:')
        console.log('baseUrl:', this.baseUrl)
        console.log('路径映射:', this.pathMappings)
      }
    } catch (error) {
      console.warn('加载 tsconfig.json 失败:', error)
    }
  }

  private resolvePath(importPath: string, currentFilePath: string): string | null {
    // 如果是相对路径，直接解析
    if (importPath.startsWith('.')) {
      return path.resolve(path.dirname(currentFilePath), importPath)
    }

    // 尝试匹配路径映射
    for (const mapping of this.pathMappings) {
      if (mapping.pattern.test(importPath)) {
        // 替换路径中的 * 通配符
        const matchedPath = importPath.replace(mapping.pattern, (match, ...args) => {
          const starIndex = mapping.pattern.toString().indexOf('.*')
          if (starIndex === -1) return match
          return args[0] || ''
        })

        // 尝试每个可能的路径
        for (const pathTemplate of mapping.paths) {
          const resolvedPath = pathTemplate.replace(/\*/g, matchedPath)
          const fullPath = path.resolve(this.baseUrl, resolvedPath)

          // 尝试不同的文件扩展名
          const extensions = ['', ...this.supportedExtensions.map((ext) => `.${ext}`)]
          for (const ext of extensions) {
            const pathWithExt = fullPath + ext
            if (fs.existsSync(pathWithExt)) {
              return pathWithExt
            }
          }
        }
      }
    }

    // 如果没有匹配的路径映射，尝试从 baseUrl 解析
    const fullPath = path.resolve(this.baseUrl, importPath)
    const extensions = ['', ...this.supportedExtensions.map((ext) => `.${ext}`)]
    for (const ext of extensions) {
      const pathWithExt = fullPath + ext
      if (fs.existsSync(pathWithExt)) {
        return pathWithExt
      }
    }

    return null
  }

  private isSupportedFile(filePath: string): boolean {
    const ext = path.extname(filePath).slice(1).toLowerCase()
    return this.supportedExtensions.includes(ext)
  }

  private shouldIgnoreDir(dirName: string): boolean {
    return this.ignoreDirs.some((ignoreDir) => dirName === ignoreDir || dirName.endsWith(path.sep + ignoreDir))
  }

  private async processFile(filePath: string): Promise<void> {
    if (this.processedFiles.has(filePath)) return
    this.processedFiles.add(filePath)

    const ext = path.extname(filePath).slice(1).toLowerCase()
    const relativePath = path.relative(this.projectRoot, filePath)

    // 添加节点
    this.tree.nodes.push({
      path: relativePath,
      dependencies: [],
      dependents: [],
      type: ext,
    })

    // 处理不同类型的文件
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      await this.processJavaScriptFile(filePath)
    } else if (ext === 'html') {
      await this.processHtmlFile(filePath)
    } else if (['css', 'less', 'scss'].includes(ext)) {
      await this.processStyleFile(filePath)
    }
  }

  private async processJavaScriptFile(filePath: string): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8')
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      })

      traverse(ast, {
        ImportDeclaration: (nodePath: NodePath<t.ImportDeclaration>) => {
          const importPath = nodePath.node.source.value
          const resolvedPath = this.resolvePath(importPath, filePath)
          if (resolvedPath) {
            this.addDependency(filePath, resolvedPath)
          }
        },
      })
    } catch (error) {
      console.error(`Error processing JavaScript file ${filePath}:`, error)
    }
  }

  private async processHtmlFile(filePath: string): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8')
      const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/g
      const linkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*>/g
      const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/g

      let match
      while ((match = scriptRegex.exec(content)) !== null) {
        const src = match[1]
        const resolvedPath = this.resolvePath(src, filePath)
        if (resolvedPath) {
          this.addDependency(filePath, resolvedPath)
        }
      }

      while ((match = linkRegex.exec(content)) !== null) {
        const href = match[1]
        const resolvedPath = this.resolvePath(href, filePath)
        if (resolvedPath) {
          this.addDependency(filePath, resolvedPath)
        }
      }

      while ((match = imgRegex.exec(content)) !== null) {
        const src = match[1]
        const resolvedPath = this.resolvePath(src, filePath)
        if (resolvedPath) {
          this.addDependency(filePath, resolvedPath)
        }
      }
    } catch (error) {
      console.error(`Error processing HTML file ${filePath}:`, error)
    }
  }

  private async processStyleFile(filePath: string): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8')
      const importRegex = /@import\s+["']([^"']+)["']/g
      const urlRegex = /url\(["']?([^"')]+)["']?\)/g

      let match
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1]
        const resolvedPath = this.resolvePath(importPath, filePath)
        if (resolvedPath) {
          this.addDependency(filePath, resolvedPath)
        }
      }

      while ((match = urlRegex.exec(content)) !== null) {
        const url = match[1]
        const resolvedPath = this.resolvePath(url, filePath)
        if (resolvedPath) {
          this.addDependency(filePath, resolvedPath)
        }
      }
    } catch (error) {
      console.error(`Error processing style file ${filePath}:`, error)
    }
  }

  private addDependency(fromPath: string, toPath: string): void {
    const fromRelative = path.relative(this.projectRoot, fromPath)
    const toRelative = path.relative(this.projectRoot, toPath)

    this.tree.edges.push({ from: fromRelative, to: toRelative })

    // 添加正向依赖
    const fromNode = this.tree.nodes.find((node) => node.path === fromRelative)
    if (fromNode && !fromNode.dependencies.includes(toRelative)) {
      fromNode.dependencies.push(toRelative)
    }

    // 添加反向依赖
    const toNode = this.tree.nodes.find((node) => node.path === toRelative)
    if (toNode && !toNode.dependents.includes(fromRelative)) {
      toNode.dependents.push(fromRelative)
    }
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = []
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      // 检查是否应该忽略该目录
      if (entry.isDirectory() && this.shouldIgnoreDir(entry.name)) {
        console.log(`忽略目录: ${fullPath}`)
        continue
      }

      if (entry.isDirectory()) {
        files.push(...(await this.getAllFiles(fullPath)))
      } else {
        files.push(fullPath)
      }
    }

    return files
  }

  public async generateTree(): Promise<DependencyTree> {
    console.log('开始生成依赖树...')
    console.log('忽略的目录:', this.ignoreDirs)
    console.log('支持的文件类型:', this.supportedExtensions)

    const files = await this.getAllFiles(this.projectRoot)
    const totalFiles = files.length
    let processedCount = 0

    for (const file of files) {
      if (this.isSupportedFile(file)) {
        await this.processFile(file)
        processedCount++
        const progress = ((processedCount / totalFiles) * 100).toFixed(2)
        console.log(`处理进度: ${progress}% (${processedCount}/${totalFiles})`)
      }
    }

    console.log('依赖树生成完成！')
    return this.tree
  }

  public async generateHtmlReport(outputPath: string): Promise<void> {
    const tree = await this.generateTree()
    const html = this.generateHtml(tree)
    await fs.promises.writeFile(outputPath, html)
    console.log(`HTML 报告已生成: ${outputPath}`)
  }

  public async generateJsonReport(outputPath: string): Promise<void> {
    const tree = await this.generateTree()
    await fs.promises.writeFile(outputPath, JSON.stringify(tree, null, 2))
    console.log(`JSON 报告已生成: ${outputPath}`)
  }

  private generateHtml(tree: DependencyTree): string {
    const nodes = tree.nodes.map((node) => ({
      id: node.path,
      label: path.basename(node.path),
      title: `
        文件路径: ${node.path}
        类型: ${node.type}
        依赖文件数: ${node.dependencies.length}
        被引用次数: ${node.dependents.length}
      `,
      group: node.type,
    }))

    const edges = tree.edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
    }))

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>项目依赖树</title>
        <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
        <style>
          #mynetwork {
            width: 100%;
            height: 100vh;
            border: 1px solid lightgray;
          }
          .info-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            max-width: 300px;
            display: none;
          }
        </style>
      </head>
      <body>
        <div id="mynetwork"></div>
        <div id="info-panel" class="info-panel"></div>
        <script type="text/javascript">
          const nodes = new vis.DataSet(${JSON.stringify(nodes)});
          const edges = new vis.DataSet(${JSON.stringify(edges)});
          const container = document.getElementById('mynetwork');
          const infoPanel = document.getElementById('info-panel');
          const data = { nodes, edges };
          const options = {
            nodes: {
              shape: 'dot',
              size: 16
            },
            physics: {
              stabilization: false,
              barnesHut: {
                gravitationalConstant: -80000,
                springConstant: 0.001,
                springLength: 200
              }
            },
            interaction: {
              hover: true
            }
          };
          
          const network = new vis.Network(container, data, options);
          
          network.on('hoverNode', function(params) {
            const node = nodes.get(params.node);
            infoPanel.innerHTML = node.title;
            infoPanel.style.display = 'block';
          });
          
          network.on('blurNode', function() {
            infoPanel.style.display = 'none';
          });
        </script>
      </body>
      </html>
    `
  }
}

export default Util
