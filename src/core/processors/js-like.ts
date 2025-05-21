import { type ImportDeclaration, parse, type TsType, type JSXAttribute } from '@swc/core'
import ASTVisitor from '../visitor'
import { glob } from 'glob'
import path from 'path'
import fs from 'fs'

class ImportAnalyzerVisitor extends ASTVisitor {
  override visitJSXAttribute(node: JSXAttribute) {
    const { value: nodeValue } = node
    let mediaPath: string = ''
    if (nodeValue) {
      if ('value' in nodeValue) {
        mediaPath = dealAstAttributeValue(nodeValue.value)
      }
      if ('expression' in nodeValue && nodeValue.expression.type === 'StringLiteral') {
        mediaPath = dealAstAttributeValue(nodeValue.expression.value)
      }
      if ('expression' in nodeValue && nodeValue.expression.type === 'TemplateLiteral') {
        mediaPath = dealAstAttributeValue(nodeValue.expression.quasis[0]?.raw)
      }
    }
    if (mediaPath) {
      importPaths.add(pathToRealPath(currentFilePath, mediaPath))
    }
    return node
  }
  override visitTsType(node: TsType) {
    return node
  }
  override visitImportDeclaration(node: ImportDeclaration) {
    // 提取导入信息
    const modulePath = node.source.value
    importPaths.add(pathToRealPath(currentFilePath, modulePath))
    return node
  }
}

const importPaths = new Set<string>()
let currentFilePath = ''
let projectRootForUse = ''
let jsLikeFiles: string[] = []
const importAnalyzerVisitor = new ImportAnalyzerVisitor()

/**
 * @description Currently, only TSX+ESModule+ is planned to be supported, and dynamic imports are not handled
 * @param code
 */
async function visitCode(code: string) {
  const ast = await parse(code, {
    syntax: 'typescript', // "ecmascript" | "typescript"
    tsx: true,
    comments: false,
    target: 'esnext',
  })
  importAnalyzerVisitor.visitModule(ast)
}

export async function jsLike(projectRoot: string) {
  projectRootForUse = projectRoot
  jsLikeFiles = await glob('src/**/*.{ts,tsx,js}')
  console.log('jsLikeFiles', jsLikeFiles)
  for (const jsLikeFile of jsLikeFiles) {
    try {
      currentFilePath = jsLikeFile
      await visitCode(fs.readFileSync(path.join(projectRoot, jsLikeFile), 'utf8'))
    } catch (e) {
      console.error('Failed to visit', jsLikeFile, `error: ${e}`)
    }
  }
  return importPaths
}

function pathToRealPath(filePath: string, importPath: string) {
  if (importPath.startsWith('@/')) {
    // Currently, only standard imports are processed, e.g. "@/components/Card.tsx" will not be processed, "@/components/.. /Card.tsx"
    return importPath.replace('@/', 'src/') //TODO use from user project
  }
  if (importPath.startsWith('../') || importPath.startsWith('./')) {
    const absolutePath = path.resolve(path.dirname(filePath), importPath)
    const relativePathForProject = path.relative(projectRootForUse, absolutePath)
    return tryToFindFilesWithoutASuffix(relativePathForProject)
  }
  return importPath
}

function dealAstAttributeValue(value: unknown) {
  if (value && typeof value === 'string') {
    return value.trim()
  }
  return ''
}

function tryToFindFilesWithoutASuffix(relativePathForProject: string) {
  console.log(relativePathForProject)
  if (jsLikeFiles.includes(`${relativePathForProject}.ts`)) {
    return `${relativePathForProject}.ts`
  }
  if (jsLikeFiles.includes(`${relativePathForProject}/index.ts`)) {
    return `${relativePathForProject}/index.ts`
  }
  if (jsLikeFiles.includes(`${relativePathForProject}.tsx`)) {
    return `${relativePathForProject}.tsx`
  }
  if (jsLikeFiles.includes(`${relativePathForProject}/index.tsx`)) {
    return `${relativePathForProject}/index.tsx`
  }
  return relativePathForProject
}
