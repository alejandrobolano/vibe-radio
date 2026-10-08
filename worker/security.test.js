import { describe, expect, it } from 'vitest'
import { isMaliciousProbePath } from './security.js'

describe('isMaliciousProbePath', () => {
  it.each([
    '/.env',
    '/backend/.env.production',
    '/.git/config',
    '/firebase-credentials.json',
    '/serviceAccountKey.json',
    '/credentials.json',
    '/%40fs/proc/self/environ',
    '/wp-admin/admin-post.php',
    '/wp-content/themes/example/lock.php',
    '/images/admin.PhP7',
    '/storage/logs/laravel.log',
    '/dashboard%2F.env',
  ])('detects %s', path => {
    expect(isMaliciousProbePath(path)).toBe(true)
  })

  it.each([
    '/',
    '/radio/es/los-40-principales-espana-b81c57c3',
    '/pais/espana',
    '/ciudad/espana/ibiza',
    '/momentos',
    '/camaras/badalona',
    '/api/weather',
    '/api/now-playing/verified-wrma-ritmo-957',
    '/assets/index.js',
    '/sitemap.xml',
    '/robots.txt',
  ])('allows %s', path => {
    expect(isMaliciousProbePath(path)).toBe(false)
  })
})
