import { it, describe, expect } from 'vitest'
import { defineMinippConfig } from '../src'
import { defaulMinippConfig, type MinippConfig } from '../src/core/common'

describe('defineMinippConfig', () => {
  it('should be default config', () => {
    expect(defineMinippConfig()).toEqual(defaulMinippConfig)
  })
  it('should merge user config', () => {
    const userConfig: MinippConfig = {
      needDel: true,
      ignoreFiles: ['src/'],
    }
    expect(defineMinippConfig(userConfig)).toEqual({
      needDel: true,
      ignoreFiles: ['src/'],
      ignoreDependencies: [],
      ignoreExt: [],
    })
  })
})
