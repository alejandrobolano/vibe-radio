import { describe, expect, it } from 'vitest'
import { formatClicks, formatCount, shouldShowClicks } from './formatClicks'

describe('formatClicks', () => {
  it('formats a valid count for Spanish readers', () => {
    expect(formatClicks(12345)).toBe('12.345')
    expect(formatCount(12345)).toBe('12.345')
  })

  it('never exposes invalid or negative counts', () => {
    expect(formatClicks(-10)).toBe('0')
    expect(formatClicks(Number.NaN)).toBe('0')
  })

  it('only exposes meaningful click counts', () => {
    expect(shouldShowClicks(0)).toBe(false)
    expect(shouldShowClicks(9)).toBe(false)
    expect(shouldShowClicks(10)).toBe(true)
  })
})
