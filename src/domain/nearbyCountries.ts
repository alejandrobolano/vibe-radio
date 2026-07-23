const countryNames = new Intl.DisplayNames(['es'], { type: 'region' })

const geographicGroups: readonly (readonly string[])[] = [
  ['ES', 'PT', 'FR', 'AD', 'MA', 'IT'],
  ['GB', 'IE', 'FR', 'BE', 'NL', 'IS'],
  ['DE', 'AT', 'CH', 'NL', 'BE', 'CZ'],
  ['IT', 'FR', 'CH', 'AT', 'SI', 'HR'],
  ['PL', 'CZ', 'SK', 'DE', 'LT', 'UA'],
  ['SE', 'NO', 'FI', 'DK', 'IS', 'EE'],
  ['GR', 'AL', 'MK', 'BG', 'TR', 'CY'],
  ['RO', 'BG', 'HU', 'RS', 'MD', 'UA'],
  ['US', 'CA', 'MX', 'BS', 'CU', 'JM'],
  ['MX', 'GT', 'BZ', 'US', 'CU', 'DO'],
  ['CU', 'JM', 'HT', 'DO', 'BS', 'US'],
  ['CR', 'PA', 'NI', 'HN', 'SV', 'GT'],
  ['CO', 'VE', 'EC', 'PE', 'PA', 'BR'],
  ['AR', 'UY', 'CL', 'PY', 'BO', 'BR'],
  ['BR', 'AR', 'UY', 'PY', 'BO', 'PE'],
  ['MA', 'ES', 'PT', 'DZ', 'TN', 'MR'],
  ['ZA', 'NA', 'BW', 'ZW', 'MZ', 'LS'],
  ['NG', 'GH', 'BJ', 'CM', 'NE', 'TG'],
  ['KE', 'TZ', 'UG', 'RW', 'ET', 'SO'],
  ['EG', 'LY', 'SD', 'IL', 'JO', 'SA'],
  ['IN', 'PK', 'BD', 'NP', 'LK', 'BT'],
  ['CN', 'JP', 'KR', 'MN', 'TW', 'VN'],
  ['TH', 'MY', 'SG', 'ID', 'KH', 'VN'],
  ['AE', 'SA', 'OM', 'QA', 'BH', 'KW'],
  ['AU', 'NZ', 'PG', 'FJ', 'ID', 'NC'],
]

const continentFallbacks = [
  'DZ AO BJ BW BF BI CV CM CF TD KM CD CG CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW',
  'AF AM AZ BH BD BT BN KH CN CY GE IN ID IR IQ IL JP JO KZ KW KG LA LB MY MV MN MM NP KP PS PH QA SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE',
  'AL AD AT BY BE BA BG HR CZ DK EE FI FR DE GR VA HU IS IE IT LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB',
  'AG BS BB BZ CA CR CU DM DO SV GD GT HT HN JM MX NI PA KN LC VC TT US',
  'AR BO BR CL CO EC GY PY PE SR UY VE',
  'AU FJ KI MH FM NR NZ PW PG WS SB TO TV VU',
].map(group => group.split(' '))

export type NearbyCountry = {
  code: string
  name: string
}

export function getNearbyCountries(countryCode: string, limit = 5): NearbyCountry[] {
  const normalizedCode = countryCode.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalizedCode) || limit <= 0) return []

  const candidates = geographicGroups
    .filter(group => group.includes(normalizedCode))
    .flatMap(group => group)
  const regionalFallback = continentFallbacks.find(group => group.includes(normalizedCode)) ?? []
  const uniqueCodes = [...new Set(candidates)]
    .concat(regionalFallback.filter(code => !candidates.includes(code)))
    .filter(code => code !== normalizedCode)
    .slice(0, limit)

  return uniqueCodes.map(code => ({ code, name: countryNames.of(code) || code }))
}
