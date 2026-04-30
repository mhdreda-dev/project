import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

const COLOR_ALIASES: Record<string, string[]> = {
  black: ['black', 'noir', 'k7el', 'khal', 'ke7el', 'كحل', 'اسود', 'أسود', 'noire'],
  white: ['white', 'blanc', 'blanche', 'byed', 'beyed', 'بيض', 'ابيض', 'أبيض'],
  red: ['red', 'rouge', 'hmer', '7mer', 'حمر', 'احمر', 'أحمر'],
  blue: ['blue', 'bleu', 'zraq', 'zer9', 'زرق', 'ازرق', 'أزرق'],
  green: ['green', 'vert', 'verte', 'khder', 'khdr', 'خضر', 'اخضر', 'أخضر'],
  gray: ['gray', 'grey', 'gris', 'grise', 'رمادي', 'گري'],
  brown: ['brown', 'marron', 'بني'],
  beige: ['beige', 'بيج'],
  pink: ['pink', 'rose', 'وردي', 'روزي'],
  yellow: ['yellow', 'jaune', 'صفر', 'اصفر', 'أصفر'],
  orange: ['orange', 'برتقالي'],
  purple: ['purple', 'violet', 'violette', 'بنفسجي'],
}

const DARIJA_FOOTWEAR_SYNONYMS = {
  shoes: [
    'sebrila',
    'sebrdila',
    'sberdila',
    'sebrdilat',
    'sberdilat',
    'sbat',
    'sabbat',
    'sbbat',
    'espadrille',
    'espadrilles',
    'basket',
    'baskets',
  ],
  sandals: ['sendala', 'sendalat', 'sandala', 'sandalat', 'sandale', 'sandales', 'sandal', 'sandals'],
} as const

const CATEGORY_ALIASES: Record<string, string[]> = {
  shoes: [
    'shoe',
    'shoes',
    'sneaker',
    'sneakers',
    'basket',
    'baskets',
    'chaussure',
    'chaussures',
    'sabaton',
    'sbabt',
    'سباط',
    'صباط',
    'حذاء',
    'احذية',
    'أحذية',
    ...DARIJA_FOOTWEAR_SYNONYMS.shoes,
  ],
  sandals: [
    'sandal',
    'sandals',
    'sandale',
    'sandales',
    'sandalia',
    'claquette',
    'claquettes',
    'صندل',
    'صندالة',
    ...DARIJA_FOOTWEAR_SYNONYMS.sandals,
  ],
  tshirt: ['tshirt', 't-shirt', 'tee', 'shirt', 't shirt', 'تيشورت', 'تشيرت', 'قميص'],
  pants: ['pants', 'jeans', 'trouser', 'trousers', 'pantalon', 'بنطلون', 'جينز'],
  hoodie: ['hoodie', 'sweat', 'sweatshirt', 'capuche', 'هودي'],
  jacket: ['jacket', 'veste', 'جاكيت', 'فيستة'],
  dress: ['dress', 'robe', 'فستان'],
  bag: ['bag', 'sac', 'sacoche', 'شنطة', 'حقيبة'],
  cap: ['cap', 'hat', 'casquette', 'كاسكيطة', 'قبعة'],
}

const STOP_WORDS = new Set([
  'do',
  'you',
  'have',
  'show',
  'find',
  'want',
  'need',
  'chno',
  'chnou',
  'achno',
  'homa',
  'huma',
  'li',
  'lli',
  'likayn',
  'likaynin',
  'likynin',
  'kaynin',
  'kayn',
  'kayna',
  'wach',
  'bghit',
  'bgha',
  'price',
  'cost',
  'much',
  'available',
  'availability',
  'what',
  'color',
  'colors',
  'size',
  'the',
  'of',
  'in',
  'for',
  'with',
  'and',
  'or',
  'de',
  'des',
  'du',
  'le',
  'la',
  'les',
  'prix',
  'taille',
  'pointure',
  'disponible',
  'avez',
  'vous',
  'avec',
  'pour',
  'كاين',
  'واش',
  'عندكم',
  'بغيت',
  'عافاك',
  'الثمن',
  'السعر',
  'بشحال',
  'مقاس',
  'قياس',
])

const SIZE_WORDS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const PRICE_INTENT_RE = /price|prix|ثمن|السعر|بشحال|how much|combien|tarif|cost/i
const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  shoes: ['shoes', 'shoe', 'sneaker', 'sneakers', 'basket', 'baskets', 'chaussure', 'chaussures', ...DARIJA_FOOTWEAR_SYNONYMS.shoes],
  sandals: ['sandals', 'sandal', 'sandale', 'sandales', 'claquette', 'claquettes', ...DARIJA_FOOTWEAR_SYNONYMS.sandals],
}

export type ProductSearchIntent = {
  size?: string
  color?: string
  category?: string
  brand?: string
  maxPrice?: number
  terms: string[]
  asksDelivery: boolean
  asksColors: boolean
  asksPrice: boolean
}

export type ProductSearchResult = {
  id: string
  name: string
  brand: string | null
  category: string | null
  description: string | null
  image: string | null
  basePrice: number
  totalStock: number
  colors: string[]
  sizes: Array<{
    size: string
    quantity: number
    price: number
  }>
}

export type ProductSearchResponse = {
  intent: ProductSearchIntent
  products: ProductSearchResult[]
  alternatives: ProductSearchResult[]
}

export function sanitizeSalesMessage(message: string) {
  return message
    .replace(/[\u0000-\u001F\u007F<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

function normalizeDarijaFootwear(value: string) {
  const normalized = normalizeText(value)
  const replacements = Object.entries(DARIJA_FOOTWEAR_SYNONYMS).flatMap(([category, aliases]) =>
    aliases.map((alias) => [normalizeText(alias), category] as const),
  )

  return replacements.reduce(
    (current, [alias, category]) => current.replace(new RegExp(`\\b${alias}\\b`, 'g'), ` ${category} `),
    normalized,
  )
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .replace(/[^\p{L}\p{N}\s.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
}

function compactSize(value?: string) {
  if (!value) return undefined
  const cleaned = value.replace(/[^\p{L}\p{N}.]/gu, '').toUpperCase()
  if (!cleaned) return undefined
  if (SIZE_WORDS.includes(cleaned)) return cleaned
  return cleaned.replace(/\.0$/, '')
}

function detectSize(message: string) {
  const normalized = normalizeText(message)
  const explicit =
    normalized.match(/(?:size|taille|pointure|numero|num|نمره|نمرة|مقاس|قياس)\s*[:#-]?\s*([a-z0-9.]+)/i) ??
    normalized.match(/\b(?:eu|fr)\s*[:#-]?\s*(3[4-9]|4[0-9]|5[0-2])\b/i)
  const standalone = normalized.match(/\b(3[4-9]|4[0-9]|5[0-2]|xxxl|xxl|xl|xs|s|m|l)\b/i)

  return compactSize(explicit?.[1] ?? standalone?.[1])
}

function detectMaxPrice(message: string) {
  const normalized = normalizeText(message)
  const match =
    normalized.match(/(?:under|less than|max|budget|moins de|maximum|اقل من|تحت)\s*(\d{2,6})/i) ??
    normalized.match(/(\d{2,6})\s*(?:mad|dh|dhs|درهم|دراهم)\s*(?:max|maximum)?/i)

  if (!match) return undefined
  const amount = Number(match[1])
  return Number.isFinite(amount) ? amount : undefined
}

function findAliasMatch(aliases: Record<string, string[]>, message: string) {
  const normalized = normalizeDarijaFootwear(message)
  return Object.entries(aliases).find(([, values]) =>
    values.some((alias) => {
      const normalizedAlias = normalizeText(alias)
      return normalized === normalizedAlias || normalized.includes(normalizedAlias) || normalized.includes(normalizeDarijaFootwear(alias))
    }),
  )?.[0]
}

export function detectProductIntent(message: string): ProductSearchIntent {
  const normalized = normalizeDarijaFootwear(message)
  const size = detectSize(message)
  const color = findAliasMatch(COLOR_ALIASES, message)
  const category = findAliasMatch(CATEGORY_ALIASES, message)
  const maxPrice = detectMaxPrice(message)

  const terms = Array.from(
    new Set(
      tokenize(normalized)
        .map((term) => term.trim())
        .filter((term) => {
          if (term.length < 2 || STOP_WORDS.has(term)) return false
          if (size && term.toUpperCase() === size) return false
          if (maxPrice && term === String(maxPrice)) return false
          const isColor = Object.values(COLOR_ALIASES).flat().some((alias) => normalizeText(alias) === term)
          const isCategoryWord = Object.values(CATEGORY_ALIASES).flat().some((alias) => normalizeText(alias) === term)
          return !isColor && !isCategoryWord
        })
        .slice(0, 10),
    ),
  )

  return {
    size,
    color,
    category,
    maxPrice,
    terms,
    asksDelivery: /deliver|delivery|livraison|وصل|توصيل|الشحن|shipping|maroc|morocco|المغرب|livrer|envoi/i.test(message),
    asksColors: /color|colors|couleur|couleurs|لون|الوان|ألوان|colors?|noir|blanc|كحل|بيض/i.test(message),
    asksPrice: PRICE_INTENT_RE.test(message) || Boolean(maxPrice),
  }
}

function inferColors(...values: Array<string | null>) {
  const haystack = normalizeText(values.filter(Boolean).join(' '))

  return Object.entries(COLOR_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => haystack.includes(normalizeText(alias))))
    .map(([color]) => color)
}

function toSearchResult(product: {
  id: string
  name: string
  description: string | null
  category: string | null
  imageUrl: string | null
  price: unknown
  brand: { name: string } | null
  sizes: Array<{ size: string; quantity: number; price: unknown | null }>
}): ProductSearchResult {
  const basePrice = Number(product.price)
  const sizes = product.sizes.map((size) => ({
    size: size.size,
    quantity: size.quantity,
    price: size.price == null ? basePrice : Number(size.price),
  }))

  return {
    id: product.id,
    name: product.name,
    brand: product.brand?.name ?? null,
    category: product.category,
    description: product.description,
    image: product.imageUrl,
    basePrice,
    totalStock: sizes.reduce((sum, size) => sum + size.quantity, 0),
    colors: inferColors(product.name, product.description, product.category, product.brand?.name ?? null),
    sizes,
  }
}

function buildWhere(intent: ProductSearchIntent, includeSize: boolean): Prisma.ProductWhereInput {
  const filters: Prisma.ProductWhereInput[] = [
    { isActive: true },
    { deletedAt: null },
  ]

  if (includeSize && intent.size) {
    filters.push({ sizes: { some: { size: { equals: intent.size, mode: 'insensitive' } } } })
  }

  if (intent.maxPrice) {
    filters.push({
      OR: [
        { price: { lte: intent.maxPrice } },
        { sizes: { some: { price: { lte: intent.maxPrice } } } },
      ],
    })
  }

  const categoryTerms = intent.category ? (CATEGORY_SEARCH_TERMS[intent.category] ?? [intent.category]) : []
  const searchTerms = Array.from(
    new Set([intent.brand, intent.category, intent.color, ...categoryTerms, ...intent.terms].filter(Boolean)),
  ).slice(0, 18)
  const searchable: Prisma.ProductWhereInput | null = searchTerms.length
    ? {
        OR: searchTerms.flatMap((term) => [
          { name: { contains: term, mode: 'insensitive' as const } },
          { sku: { contains: term, mode: 'insensitive' as const } },
          { description: { contains: term, mode: 'insensitive' as const } },
          { category: { contains: term, mode: 'insensitive' as const } },
          { brand: { name: { contains: term, mode: 'insensitive' as const } } },
        ]),
      }
    : null

  return {
    AND: searchable ? [...filters, searchable] : filters,
  }
}

function scoreProduct(product: ProductSearchResult, intent: ProductSearchIntent) {
  const haystack = normalizeText([product.name, product.brand, product.category, product.description].filter(Boolean).join(' '))
  const hasRequestedSize = intent.size
    ? product.sizes.some((size) => size.size.toLowerCase() === intent.size?.toLowerCase())
    : false
  const hasRequestedSizeInStock = intent.size
    ? product.sizes.some((size) => size.size.toLowerCase() === intent.size?.toLowerCase() && size.quantity > 0)
    : false
  const hasAnyStock = product.totalStock > 0

  let score = 0
  if (hasAnyStock) score += 20
  if (hasRequestedSize) score += 12
  if (hasRequestedSizeInStock) score += 30
  if (intent.brand && normalizeText(product.brand ?? '').includes(normalizeText(intent.brand))) score += 18
  if (intent.category && normalizeText(product.category ?? '').includes(normalizeText(intent.category))) score += 14
  if (
    intent.category &&
    (CATEGORY_SEARCH_TERMS[intent.category] ?? []).some((term) => haystack.includes(normalizeText(term)))
  ) {
    score += 12
  }
  if (intent.color && product.colors.includes(intent.color)) score += 12
  if (intent.maxPrice && product.sizes.some((size) => size.quantity > 0 && size.price <= intent.maxPrice!)) score += 8
  score += intent.terms.reduce((total, term) => total + (haystack.includes(normalizeText(term)) ? 4 : 0), 0)

  return score
}

function sortProducts(products: ProductSearchResult[], intent: ProductSearchIntent) {
  return [...products].sort((left, right) => scoreProduct(right, intent) - scoreProduct(left, intent))
}

async function enrichIntentFromCatalog(intent: ProductSearchIntent): Promise<ProductSearchIntent> {
  const [brands, categories] = await Promise.all([
    db.brand.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: { name: 'asc' },
      take: 500,
    }),
    db.product.groupBy({
      by: ['category'],
      where: { category: { not: null }, isActive: true, deletedAt: null },
      orderBy: { category: 'asc' },
      take: 500,
    }),
  ])

  const normalizedTerms = intent.terms.map(normalizeText)
  const brand = brands.find((brand) => {
    const normalizedBrand = normalizeText(brand.name)
    return normalizedTerms.includes(normalizedBrand) || normalizedTerms.some((term) => normalizedBrand.includes(term))
  })?.name
  const category = categories.find((row) => {
    const category = row.category ?? ''
    const normalizedCategory = normalizeText(category)
    const categoryTerms = category ? (CATEGORY_SEARCH_TERMS[category] ?? []) : []
    return (
      normalizedTerms.includes(normalizedCategory) ||
      normalizedTerms.some((term) => normalizedCategory.includes(term)) ||
      categoryTerms.some((term) => normalizedTerms.includes(normalizeText(term)))
    )
  })?.category

  return {
    ...intent,
    brand: intent.brand ?? brand,
    category: intent.category ?? category ?? undefined,
  }
}

async function findProducts(intent: ProductSearchIntent, includeSize: boolean) {
  const rows = await db.product.findMany({
    where: buildWhere(intent, includeSize),
    include: {
      brand: { select: { name: true } },
      sizes: { orderBy: { size: 'asc' }, select: { size: true, quantity: true, price: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  })

  return sortProducts(rows.map(toSearchResult), intent)
}

function uniqueProducts(products: ProductSearchResult[]) {
  const seen = new Set<string>()
  return products.filter((product) => {
    if (seen.has(product.id)) return false
    seen.add(product.id)
    return true
  })
}

export async function searchProducts(message: string): Promise<ProductSearchResponse> {
  const sanitized = sanitizeSalesMessage(message)
  const intent = await enrichIntentFromCatalog(detectProductIntent(sanitized))
  const products = await findProducts(intent, Boolean(intent.size))
  const relaxedProducts = intent.size || products.length === 0 ? await findProducts(intent, false) : []
  const broadAlternatives =
    relaxedProducts.length < 3 && (intent.brand || intent.category)
      ? await findProducts({ ...intent, terms: [], color: undefined, maxPrice: undefined }, false)
      : []

  return {
    intent,
    products,
    alternatives: uniqueProducts([...relaxedProducts, ...broadAlternatives])
      .filter((alternative) => alternative.totalStock > 0)
      .slice(0, 5),
  }
}

/*
  Parsing examples kept close to the helper for future Phase 2 channel tests:
  - "Do you have Nike size 42 black?" -> brand/catalog term Nike, size 42, color black
  - "Prix Adidas noir moins de 900 dh" -> brand/catalog term Adidas, color black, price intent, maxPrice 900
  - "واش كاين سباط كحل نمرة 43؟" -> category shoes, color black, size 43
  - "chno homa sebrdilat likynin" -> category shoes, broad in-stock shoes/sneakers
  - "wach kayna sendala 42" -> category sandals, size 42
  - "bghit tshirt blanc taille M" -> category tshirt, color white, size M
*/
