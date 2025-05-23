#!/usr/bin/env node

import { parseArgs } from './core/cli'
import { jsLike } from './core/processors/js-like'
import { styleLike } from './core/processors/style-like.ts'
import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import { supportFileTypes } from './core/common'
import yoctoSpinner from 'yocto-spinner'

async function main() {
  const { projectRoot } = parseArgs()
  console.log('Running minipp from project', projectRoot)
  // Currently, only ES Module + React + TS projects are considered
  const spinner = yoctoSpinner({ text: 'Start reading the project file...' }).start()
  const projectFiles = await glob(`src/**/*.{${supportFileTypes.toString()}}`)
  spinner.text = 'Start extracting code file import information...'
  const jsLikeImports = await jsLike(projectRoot)
  spinner.text = 'Start extracting the style code file import information...'
  const styleLikeImports = await styleLike(projectRoot)
  spinner.text = 'Start exporting JSON reports...'
  const jsonReport = {
    jsLikeImports: [...jsLikeImports],
    styleLikeImports: [...styleLikeImports],
    unusedFile: projectFiles
      .filter((projectFile) => !jsLikeImports.has(projectFile))
      .filter((projectFile) => !styleLikeImports.has(projectFile)),
  }
  const minippJsonPath = path.join(projectRoot, 'minipp-report.json')
  fs.writeFileSync(minippJsonPath, JSON.stringify(jsonReport, null, 2))
  spinner.success(
    `The export report is complete, and the execution is complete! The report path is located at: ${minippJsonPath}`,
  )
}

main().catch(console.error)
