const one = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
const ten = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
const two = n => n < 20 ? one[n] : `${ten[Math.floor(n/10)]}${n%10 ? ` ${one[n%10]}` : ''}`
const three = n => n >= 100 ? `${one[Math.floor(n/100)]} Hundred${n%100 ? ` ${two(n%100)}` : ''}` : two(n)
export function rupeesInWords(amount) {
  const value = Math.round((Number(amount) || 0) * 100); const r = Math.floor(value / 100), p = value % 100
  if (!r) return `Zero Rupees${p ? ` and ${two(p)} Paise` : ''} Only`
  const parts = [[10000000,'Crore'],[100000,'Lakh'],[1000,'Thousand']]; let rem = r; const out=[]
  for (const [d, label] of parts) { if (rem >= d) { out.push(`${three(Math.floor(rem/d))} ${label}`); rem %= d } }
  if (rem) out.push(three(rem)); return `${out.join(' ')} Rupees${p ? ` and ${two(p)} Paise` : ''} Only`
}
