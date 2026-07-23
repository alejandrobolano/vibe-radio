import { describe, expect, it } from 'vitest'
import { getMomentSlugFromPath, getMomentUrl, isMomentsHubPath } from './momentUrl'

describe('moment routes', () => {
  it('builds canonical moment URLs', () => {
    expect(getMomentUrl('trabajar')).toBe('/momento/trabajar')
  })

  it('recognizes the moments hub with an optional trailing slash', () => {
    expect(isMomentsHubPath('/momentos')).toBe(true)
    expect(isMomentsHubPath('/momentos/')).toBe(true)
    expect(isMomentsHubPath('/momento/trabajar')).toBe(false)
  })

  it('extracts valid route-shaped slugs', () => {
    expect(getMomentSlugFromPath('/momento/relajarse')).toBe('relajarse')
    expect(getMomentSlugFromPath('/momento/dormir/')).toBe('dormir')
    expect(getMomentSlugFromPath('/momentos')).toBeNull()
    expect(getMomentSlugFromPath('/momento/')).toBeNull()
  })
})
