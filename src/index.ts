#!/usr/bin/env node

import { parseArgs } from './core/cli'
import { jsLike } from './core/processors/js-like'
import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import { supportFileTypes } from './core/common'
import { styleLike } from './core/processors/style-like.ts'

async function main() {
  const { projectRoot, options } = parseArgs()
  console.log('Running code from project', projectRoot)
  console.log('User parameter options:', options)
  // Currently, only ES Module + React + TS projects are considered
  const projectFiles = await glob(`src/**/*.{${supportFileTypes.toString()}}`)
  const jsLikeImports = await jsLike(projectRoot)
  const styleLikeImports = await styleLike(projectRoot)
  const jsonReport = {
    jsLikeImports: [...jsLikeImports],
    styleLikeImports: [...styleLikeImports],
    unusedFile: projectFiles
      .filter((projectFile) => !jsLikeImports.has(projectFile))
      .filter((projectFile) => !styleLikeImports.has(projectFile)),
  }
  fs.writeFileSync(path.join(projectRoot, 'minipp-report.json'), JSON.stringify(jsonReport, null, 2))
}

main().catch(console.error)
