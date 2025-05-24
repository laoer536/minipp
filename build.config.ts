import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index.ts', 'src/core/cli/index.ts'],
  failOnWarn: false,
  declaration: true,
})
