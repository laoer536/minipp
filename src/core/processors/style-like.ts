import { glob } from 'glob'
import fs from 'fs'
import path from 'path'
import { supportFileTypesWithDot } from '../common'

let currentFilePath = ''
let projectRootForUse = ''
let styleLikeFiles: string[] = []

export async function styleLike(projectRoot: string) {
  projectRootForUse = projectRoot
  styleLikeFiles = await glob('src/**/*.{css,scss,less}')
  const importPaths = new Set<string>()
  for (const styleLikeFile of styleLikeFiles) {
    try {
      currentFilePath = styleLikeFile
      const code = fs.readFileSync(currentFilePath, 'utf8')
      const extractStyleImports = getExtractStyleImports(code)
      extractStyleImports.forEach((ele) => importPaths.add(ele.trim()))
    } catch (e) {
      console.error('Failed to visit', styleLikeFile, `error: ${e}`)
    }
  }
  return importPaths
}

/**
 * @description At present, it can only handle static paths, and cannot handle dynamic interpolation syntax.
 * @param code
 */
export function getExtractStyleImports(code: string): string[] {
  const regex = /@import\s+(?:url\()?['"]?([^'")]+)['"]?\)?|url\(\s*['"]?([^'")]+)['"]?\s*\)/gi
  const result: string[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(code)) !== null) {
    const rawPath = match[1] || match[2]
    if (!rawPath) continue
    if (/[{$#]/.test(rawPath)) continue
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const path = rawPath.split(/[?#]/)[0].trim()
    // 排除 http(s)://、//、/ 开头的绝对路径
    if (!/^([a-z]+:)?\/\//i.test(path) && !path.startsWith('/')) {
      hasFileExtension(path) && result.push(pathToRealPath(currentFilePath, path))
    }
  }
  return result
}

function pathToRealPath(currentFilePath: string, importPath: string) {
  if (importPath.startsWith('@/')) {
    //TODO use from user project
    return importPath.replace('@/', 'src/')
  } else {
    const absolutePath = path.resolve(path.dirname(currentFilePath), importPath)
    return path.relative(projectRootForUse, absolutePath)
  }
}

const hasFileExtension = (filePath: string): boolean => {
  const ext = path.extname(filePath)
  return supportFileTypesWithDot.includes(ext)
}
