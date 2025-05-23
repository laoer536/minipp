import path from 'path'
import fs from 'fs'

interface ProjectDependencies {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
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
