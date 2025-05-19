import { ImportDeclaration, parse, TsType } from '@swc/core'
import ASTVisitor from '@swc/core/Visitor'
import { glob } from 'glob'
import path from 'path'
import fs from 'fs'

const importPaths = new Set<string>()
class ImportAnalyzerVisitor extends ASTVisitor {
  visitTsType(node: TsType) {
    return node
  }
  visitImportDeclaration(node: ImportDeclaration) {
    // 提取导入信息
    const modulePath = node.source.value
    importPaths.add(modulePath)
    return node
  }
}

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
  const jsLikeFiles = await glob('src/**/*.{ts,tsx,js}')
  for (const jsLikeFile of jsLikeFiles) {
    try {
      await visitCode(fs.readFileSync(path.join(projectRoot, jsLikeFile), 'utf8'))
    } catch (e) {
      console.error('Failed to visit', jsLikeFile, `error: ${e}`)
    }
  }
  return importPaths
}
