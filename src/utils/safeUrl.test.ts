import { describe, expect, it } from 'vitest'
import { getSafeHttpUrl } from './safeUrl'

describe('getSafeHttpUrl', () => {
  it('accepts HTTP and HTTPS URLs', () => {
    expect(getSafeHttpUrl('https://example.com/radio')).toBe('https://example.com/radio')
    expect(getSafeHttpUrl('http://example.com/stream')).toBe('http://example.com/stream')
  })

  it('rejects executable and malformed URLs', () => {
    expect(getSafeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(getSafeHttpUrl('data:text/html,test')).toBeNull()
    expect(getSafeHttpUrl('not a url')).toBeNull()
  })
})
