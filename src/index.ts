import path from 'path'
import Util from './util'

interface CliOptions {
  ignoreDirs?: string[]
  supportedExtensions?: string[]
  tsConfigPath?: string
}

function parseArgs(): { projectRoot: string; options: CliOptions } {
  const args = process.argv.slice(2)
  const options: CliOptions = {}
  let projectRoot = process.cwd()

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--ignore' && args[i + 1]) {
      options.ignoreDirs = args[i + 1].split(',')
      i++
    } else if (arg === '--extensions' && args[i + 1]) {
      options.supportedExtensions = args[i + 1].split(',')
      i++
    } else if (arg === '--tsconfig' && args[i + 1]) {
      options.tsConfigPath = args[i + 1]
      i++
    } else if (!arg.startsWith('--')) {
      projectRoot = path.resolve(arg)
    }
  }

  return { projectRoot, options }
}

async function main() {
  const { projectRoot, options } = parseArgs()

  console.log('项目根目录:', projectRoot)
  if (options.ignoreDirs) {
    console.log('忽略的目录:', options.ignoreDirs)
  }
  if (options.supportedExtensions) {
    console.log('支持的文件类型:', options.supportedExtensions)
  }
  if (options.tsConfigPath) {
    console.log('TypeScript 配置文件:', options.tsConfigPath)
  }

  // 创建依赖树生成器实例
  const generator = new Util(projectRoot, options)

  // 生成 HTML 报告
  const htmlOutputPath = path.join(projectRoot, 'dependency-tree.html')
  await generator.generateHtmlReport(htmlOutputPath)

  // 生成 JSON 报告
  const jsonOutputPath = path.join(projectRoot, 'dependency-tree.json')
  await generator.generateJsonReport(jsonOutputPath)
}

main().catch(console.error)
