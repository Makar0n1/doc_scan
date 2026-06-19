// Перевод целого числа в слова на русском (для суммы прописью).
// Род по умолчанию мужской (доллар, рубль — мужской род); тысячи — женский род.
// Используется и на фронте (подсказка оператору), и потенциально на бэке.

const HUNDREDS = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот']
const TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто']
const TEENS = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать']
const ONES_M = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']
const ONES_F = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']

// Выбор формы слова по числу: [1, 2-4, 5-20].
function plural(n, forms) {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return forms[0]
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1]
  return forms[2]
}

// Группа из трёх цифр (0..999) словами.
function tripleToWords(num, female) {
  const out = []
  const h = Math.floor(num / 100)
  const rest = num % 100
  if (h) out.push(HUNDREDS[h])
  if (rest >= 10 && rest <= 19) {
    out.push(TEENS[rest - 10])
  } else {
    const t = Math.floor(rest / 10)
    const o = rest % 10
    if (t) out.push(TENS[t])
    if (o) out.push((female ? ONES_F : ONES_M)[o])
  }
  return out.join(' ')
}

/**
 * Целое число -> слова. Поддерживает 0..999 999 999.
 * @param {number|string} value
 * @returns {string} например 8000 -> "восемь тысяч", 900 -> "девятьсот"
 */
export function numberToWordsRu(value) {
  let n = parseInt(String(value).replace(/\D/g, ''), 10)
  if (!Number.isFinite(n)) return ''
  if (n === 0) return 'ноль'

  const parts = []
  const millions = Math.floor(n / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1000)
  const units = n % 1000

  if (millions) {
    parts.push(tripleToWords(millions, false))
    parts.push(plural(millions, ['миллион', 'миллиона', 'миллионов']))
  }
  if (thousands) {
    parts.push(tripleToWords(thousands, true)) // тысяча — женский род
    parts.push(plural(thousands, ['тысяча', 'тысячи', 'тысяч']))
  }
  if (units) {
    parts.push(tripleToWords(units, false))
  }
  return parts.filter(Boolean).join(' ')
}

// Целое количество цифр из значения (или NaN).
function toInt(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits === '' ? NaN : parseInt(digits, 10)
}

/**
 * Сумма в долларах прописью со склонением: 1→доллар, 2-4→доллара, 5+→долларов.
 * Напр.: 34563 → «тридцать четыре тысячи пятьсот шестьдесят три доллара США».
 */
export function dollarsWords(value) {
  const n = toInt(value)
  if (!Number.isFinite(n)) return ''
  const noun = plural(n, ['доллар', 'доллара', 'долларов'])
  return `${numberToWordsRu(n)} ${noun} США`
}

/**
 * Сумма в белорусских рублях прописью со склонением:
 * 1→белорусский рубль, 2-4→белорусских рубля, 5+→белорусских рублей.
 * Напр.: 300 → «триста белорусских рублей 00 копеек».
 */
export function rublesWords(value) {
  const n = toInt(value)
  if (!Number.isFinite(n)) return ''
  const adj = plural(n, ['белорусский', 'белорусских', 'белорусских'])
  const noun = plural(n, ['рубль', 'рубля', 'рублей'])
  return `${numberToWordsRu(n)} ${adj} ${noun} 00 копеек`
}
