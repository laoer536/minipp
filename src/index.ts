#!/usr/bin/env node

import { parseArgs } from './core/cli'
import { jsLike } from './core/processors/js-like'
import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

async function main() {
  const { projectRoot, options } = parseArgs()
  console.log('Running code from project', projectRoot)
  console.log('User parameter options:', options)
  // Currently, only ES Module + React + TS projects are considered
  const projectFiles = await glob(
    'src/**/*.{ts,tsx,less,scss,css,png,jpg,jpeg,gif,svg,mp3,mp4,wav,woff,woff2,ttf,eot,json}',
  )
  const jsLikeImports = await jsLike(projectRoot)
  const jsonReport = {
    jsLikeImports: [...jsLikeImports],
    unusedFile: projectFiles.filter((projectFile) => !jsLikeImports.has(projectFile)),
  }
  fs.writeFileSync(path.join(projectRoot, 'minipp-report.json'), JSON.stringify(jsonReport, null, 2))
}

main().catch(console.error)
