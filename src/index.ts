#!/usr/bin/env node

import { jsLike } from './core/processors/js-like'
import { styleLike } from './core/processors/style-like.ts'
import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import { getProjectDependencies, supportFileTypes } from './core/common'
import yoctoSpinner from 'yocto-spinner'
import { styleText } from 'util'
import { parseArgs } from './core/cli'

async function main() {
  const { projectRoot } = parseArgs()
  console.log('Running minipp from project', projectRoot)

  /**
   * Step1
   */
  const spinner = yoctoSpinner({ text: 'Start reading the project file...' }).start()
  //Currently, only ES Module + React + TS projects are considered
  const projectFiles = await glob(`src/**/*.{${supportFileTypes.toString()}}`, { nodir: true })

  /**
   * Step2
   */
  spinner.text = 'Start extracting code file import information...'
  const { importPaths, importDependencies } = await jsLike(projectRoot)

  /**
   * Step3
   */
  spinner.text = 'Start extracting the style code file import information...'
  const styleLikeImports = await styleLike(projectRoot)

  /**
   * Step4
   */
  spinner.text = 'Get project external dependencies...'
  const dependencies = getProjectDependencies(projectRoot)

  /**
   * Step5
   */
  spinner.text = 'Start exporting JSON reports...'
  const jsonReport = {
    jsLikePathImports: [...importPaths],
    jsLikeDependenceImports: [...importDependencies],
    styleLikeImports: [...styleLikeImports],
    unusedFile: projectFiles
      .filter((projectFile) => !importPaths.has(projectFile))
      .filter((projectFile) => !styleLikeImports.has(projectFile)),
    codeUnusedDependencies: [...dependencies].filter((dependency) => !importDependencies.has(dependency)),
  }

  const minippJsonPath = path.join(projectRoot, 'minipp-report.json')
  fs.writeFileSync(minippJsonPath, JSON.stringify(jsonReport, null, 2))
  spinner.success(
    styleText(
      'green',
      `The export report is complete, and the execution is complete! The report path is located at: ${styleText('yellow', minippJsonPath)}`,
    ),
  )
}

main().catch(console.error)
