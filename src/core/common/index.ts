import path from 'path'
import fs from 'fs'
import url from 'url'
import { transform } from '@swc/core'

interface ProjectDependencies {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

export interface MinippConfig {
  needDel?: boolean
  ignoreExt?: string[]
  ignoreFiles?: string[]
  ignoreDependencies?: string[]
}

export const defaulMinippConfig: MinippConfig = {
  needDel: false,
  ignoreExt: [],
  ignoreFiles: [],
  ignoreDependencies: [],
}

export const supportFileTypes = [
  'ts',
  'tsx',
  'less',
  'scss',
  'css',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'mp3',
  'mp4',
  'wav',
  'woff',
  'woff2',
  'ttf',
  'eot',
  'json',
]

export const supportFileTypesWithDot = supportFileTypes.map((fileType) => `.${fileType}`)

export function getProjectDependencies(projectRoot: string): Set<string> {
  const packageJsonPath = path.join(projectRoot, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found in ${projectRoot}`)
  }
  const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const dependencies: Set<string> = new Set<string>()
  const dependenciesInfo: ProjectDependencies = {
    dependencies: pkgJson.dependencies || {},
    devDependencies: pkgJson.devDependencies || {},
  }
  let type: keyof typeof dependenciesInfo
  for (type in dependenciesInfo) {
    for (const packageName in dependenciesInfo[type]) {
      dependencies.add(packageName)
    }
  }
  return dependencies
}

export interface CliOptions {
  ignoreDirs?: string[]
  supportedExtensions?: string[]
  tsConfigPath?: string
}

export function parseArgs(): { projectRoot: string; options: CliOptions } {
  const args = process.argv.slice(2)
  const options: CliOptions = {}
  let projectRoot = process.cwd()

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--ignore' && args[i + 1]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      options.ignoreDirs = args[i + 1].split(',')
      i++
    } else if (arg === '--extensions' && args[i + 1]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      options.supportedExtensions = args[i + 1].split(',')
      i++
    } else if (arg === '--tsconfig' && args[i + 1]) {
      options.tsConfigPath = args[i + 1]
      i++
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      if (!arg.startsWith('--')) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        projectRoot = path.resolve(arg)
      }
    }
  }

  return { projectRoot, options }
}

export async function loadUserConfig(configPath: string): Promise<MinippConfig> {
  const ext = path.extname(configPath)
  let configExport: MinippConfig = defaulMinippConfig

  if (ext === '.js' || ext === '.cjs' || ext === '.mjs') {
    // 直接加载 JS 配置
    const imported = await import(url.pathToFileURL(configPath).href)
    configExport = imported.default ?? imported
  } else if (ext === '.ts') {
    // 用 swc 编译 ts 配置为 js
    const sourceCode = fs.readFileSync(configPath, 'utf-8')
    const { code } = await transform(sourceCode, {
      filename: configPath,
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: false,
        },
        target: 'es2020',
      },
      module: {
        type: 'es6',
      },
    })
    const tempFile = configPath + '.tmp.mjs'
    fs.writeFileSync(tempFile, code)
    try {
      const imported = await import(url.pathToFileURL(tempFile).href)
      configExport = imported.default ?? imported
    } finally {
      fs.unlinkSync(tempFile)
    }
  }

  // 执行导出的内容
  return { ...defaulMinippConfig, ...configExport }
}

export function defineMinippConfig(minippConfig: MinippConfig) {
  return { ...defaulMinippConfig, ...minippConfig }
}
