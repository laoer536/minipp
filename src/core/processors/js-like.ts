import {
  type ImportDeclaration,
  parse,
  type TsType,
  type JSXAttribute,
  type CallExpression,
  type Expression,
} from '@swc/core'
import ASTVisitor from '../visitor'
import { glob } from 'glob'
import path from 'path'
import fs from 'fs'
import { supportFileTypesWithDot } from '../common'
import { styleText } from 'util'

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
    if (hasFileExtension(mediaPath)) {
      const realPath = pathToRealPath(currentFilePath, mediaPath)
      realPath.startsWith('src') ? importPaths.add(realPath) : importDependencies.add(realPath)
    }
    return super.visitJSXAttribute(node)
  }
  override visitTsType(node: TsType) {
    return node
  }
  override visitImportDeclaration(node: ImportDeclaration) {
    const modulePath = node.source.value
    const realPath = pathToRealPath(currentFilePath, modulePath)
    realPath.startsWith('src') ? importPaths.add(realPath) : importDependencies.add(realPath)
    return super.visitImportDeclaration(node)
  }
  override visitCallExpression(node: CallExpression): Expression {
    const { callee, arguments: callExpressionArguments } = node
    if (callee.type === 'Import') {
      if (callExpressionArguments[0]?.expression.type === 'StringLiteral') {
        const expression = callExpressionArguments[0].expression
        const realPath = pathToRealPath(currentFilePath, expression.value)
        realPath.startsWith('src') ? importPaths.add(realPath) : importDependencies.add(realPath)
      }
    }
    return super.visitCallExpression(node)
  }
}

const importPaths = new Set<string>()
const importDependencies = new Set<string>()
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
  jsLikeFiles = await glob('src/**/*.{ts,tsx}', { nodir: true })
  for (const jsLikeFile of jsLikeFiles) {
    try {
      currentFilePath = jsLikeFile
      await visitCode(fs.readFileSync(path.join(projectRoot, jsLikeFile), 'utf8'))
    } catch (e) {
      console.error(styleText('red', `Failed to visit:${jsLikeFile},${JSON.stringify(e, null, 2)}`))
    }
  }
  return {
    importPaths,
    importDependencies,
  }
}

function pathToRealPath(currentFilePath: string, importPath: string) {
  if (importPath.startsWith('@/')) {
    // Currently, only standard imports are processed, e.g. "@/components/Card.tsx" will not be processed, "@/components/.. /Card.tsx"
    const relativePathForProject = importPath.replace('@/', 'src/') //TODO use from user project
    return hasFileExtension(relativePathForProject)
      ? relativePathForProject
      : tryToFindFilesWithoutASuffix(relativePathForProject)
  }
  if (importPath.startsWith('..') || importPath.startsWith('.')) {
    const absolutePath = path.resolve(path.dirname(currentFilePath), importPath)
    const relativePathForProject = path.relative(projectRootForUse, absolutePath)
    return hasFileExtension(relativePathForProject)
      ? relativePathForProject
      : tryToFindFilesWithoutASuffix(relativePathForProject)
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
  if (jsLikeFiles.includes(`${relativePathForProject}.ts`)) {
    return `${relativePathForProject}.ts`
  }
  if (jsLikeFiles.includes(`${relativePathForProject}.tsx`)) {
    return `${relativePathForProject}.tsx`
  }
  if (jsLikeFiles.includes(`${relativePathForProject}/index.ts`)) {
    return `${relativePathForProject}/index.ts`
  }
  if (jsLikeFiles.includes(`${relativePathForProject}/index.tsx`)) {
    return `${relativePathForProject}/index.tsx`
  }
  if (jsLikeFiles.includes(`${relativePathForProject}.d.ts`)) {
    return `${relativePathForProject}.d.ts`
  }
  if (jsLikeFiles.includes(`${relativePathForProject}/index.d.ts`)) {
    return `${relativePathForProject}/index.d.ts`
  }
  return `${relativePathForProject}(Unknown file type, the file does not exist in the scan directory, or is not a TSX, TS or .d.ts file)`
}

function hasFileExtension(filePath: string) {
  const ext = path.extname(filePath)
  return supportFileTypesWithDot.includes(ext)
}
