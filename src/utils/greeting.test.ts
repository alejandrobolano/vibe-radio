import { describe, expect, it } from 'vitest'
import { getGreeting } from './greeting'

describe('getGreeting', () => {
  it('uses the local time boundaries for each greeting', () => {
    expect(getGreeting(5)).toBe('Buenos días')
    expect(getGreeting(11)).toBe('Buenos días')
    expect(getGreeting(12)).toBe('Buenas tardes')
    expect(getGreeting(19)).toBe('Buenas tardes')
    expect(getGreeting(20)).toBe('Buenas noches')
    expect(getGreeting(4)).toBe('Buenas noches')
  })
})
