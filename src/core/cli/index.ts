import path from 'path'

export interface CliOptions {
  ignoreDirs?: string[]
  supportedExtensions?: string[]
  tsConfigPath?: string
}

export function parseArgs(): { projectRoot: string; options: CliOptions } {
  const args = process.argv.slice(2)
  const options: CliOptions = {}
  let projectRoot = process.cwd()

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--ignore' && args[i + 1]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      options.ignoreDirs = args[i + 1].split(',')
      i++
    } else if (arg === '--extensions' && args[i + 1]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      options.supportedExtensions = args[i + 1].split(',')
      i++
    } else if (arg === '--tsconfig' && args[i + 1]) {
      options.tsConfigPath = args[i + 1]
      i++
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      if (!arg.startsWith('--')) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        projectRoot = path.resolve(arg)
      }
    }
  }

  return { projectRoot, options }
}
