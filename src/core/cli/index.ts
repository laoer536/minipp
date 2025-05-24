#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import yoctoSpinner from 'yocto-spinner'
import { styleText } from 'util'
import { getProjectDependencies, loadUserConfig, parseArgs, supportFileTypes } from '../common'
import { jsLike } from '../processors/js-like.ts'
import { styleLike } from '../processors/style-like.ts'

async function main() {
  const { projectRoot } = parseArgs()
  console.log('Running minipp from project', projectRoot)
  const { ignoreFiles, ignoreDependencies } = await loadUserConfig(path.join(projectRoot, 'minipp.config.ts'))
  let ignoreFilesSet: Set<string> | undefined
  let ignoreDependenciesSet: Set<string> | undefined
  if (ignoreFiles && ignoreFiles.length > 0) {
    ignoreFilesSet = new Set<string>(ignoreFiles)
  }
  if (ignoreDependencies && ignoreDependencies.length > 0) {
    ignoreDependenciesSet = new Set<string>(ignoreDependencies)
  }

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
  const getUnusedFile = () => {
    const baseFilter = projectFiles
      .filter((projectFile) => !importPaths.has(projectFile))
      .filter((projectFile) => !styleLikeImports.has(projectFile))
    if (ignoreFilesSet) {
      return baseFilter.filter((item) => !ignoreFilesSet.has(item))
    }
    return baseFilter
  }
  const getUnusedDependenciesSet = () => {
    const baseFilter = [...dependencies].filter((dependency) => !importDependencies.has(dependency))
    if (ignoreDependenciesSet) {
      return baseFilter.filter((item) => !ignoreDependenciesSet.has(item))
    }
    return baseFilter
  }
  const jsonReport = {
    jsLikePathImports: [...importPaths],
    jsLikeDependenceImports: [...importDependencies],
    styleLikeImports: [...styleLikeImports],
    unusedFile: getUnusedFile(),
    codeUnusedDependencies: getUnusedDependenciesSet(),
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
