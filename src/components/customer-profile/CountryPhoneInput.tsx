import { useState } from 'react'

const COUNTRY_CODES = [
  { country: 'Indonesia', code: '+62', shortName: 'ID' },
  { country: 'United States', code: '+1', shortName: 'US' },
  { country: 'United Kingdom', code: '+44', shortName: 'UK' },
  { country: 'Singapore', code: '+65', shortName: 'SG' },
  { country: 'Malaysia', code: '+60', shortName: 'MY' },
  { country: 'Australia', code: '+61', shortName: 'AU' },
  { country: 'Japan', code: '+81', shortName: 'JP' },
  { country: 'South Korea', code: '+82', shortName: 'KR' },
  { country: 'China', code: '+86', shortName: 'CN' },
  { country: 'India', code: '+91', shortName: 'IN' },
  { country: 'Netherlands', code: '+31', shortName: 'NL' },
  { country: 'Germany', code: '+49', shortName: 'DE' },
  { country: 'France', code: '+33', shortName: 'FR' },
  { country: 'Saudi Arabia', code: '+966', shortName: 'SA' },
  { country: 'United Arab Emirates', code: '+971', shortName: 'AE' },
]

function splitPhone(value: string) {
  const normalized = value.trim()
  const country = COUNTRY_CODES.find(({ code }) => normalized.startsWith(`${code} `) || normalized.startsWith(code))
  return {
    code: country?.code ?? '+62',
    number: country ? normalized.slice(country.code.length).trim() : normalized.startsWith('+') ? normalized.replace(/^\+\d+\s*/, '') : normalized,
  }
}

export function CountryPhoneInput({
  label,
  value,
  onSave,
}: {
  label: string
  value: string
  onSave: (value: string) => void
}) {
  const [phone, setPhone] = useState(() => splitPhone(value))
  const selectedCountry = COUNTRY_CODES.find(({ code }) => code === phone.code)

  const save = (code: string, number: string) => onSave(`${code} ${number}`.trim())

  return (
    <div className="grid min-w-0 flex-1 grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2">
      <select
        aria-label={`${label} kode negara`}
        value={phone.code}
        onChange={(event) => {
          const code = event.target.value
          setPhone((current) => ({ ...current, code }))
          save(code, phone.number)
        }}
        title={selectedCountry ? `${selectedCountry.country} ${selectedCountry.code}` : 'Pilih kode negara'}
        className="w-full min-w-0 rounded-md border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] text-slate-300 outline-none focus:border-blue-500"
      >
        {COUNTRY_CODES.map(({ country, code, shortName }) => <option key={code} value={code}>{shortName} {code} · {country}</option>)}
      </select>
      <input
        aria-label={label}
        type="tel"
        value={phone.number}
        onChange={(event) => setPhone((current) => ({ ...current, number: event.target.value }))}
        onBlur={() => save(phone.code, phone.number)}
        placeholder={`Buat ${label} Disini`}
        className="w-full min-w-0 rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500"
      />
    </div>
  )
}
