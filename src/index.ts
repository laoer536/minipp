#!/usr/bin/env node

import { parseArgs } from './core/cli'

function main() {
  const { projectRoot, options } = parseArgs()
  console.log(projectRoot, options)
}

main()
