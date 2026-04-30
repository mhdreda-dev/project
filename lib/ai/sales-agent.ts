import { formatCurrency } from '@/lib/utils'
import {
  ProductSearchResponse,
  ProductSearchResult,
  sanitizeSalesMessage,
  searchProducts,
} from '@/lib/ai/product-search'

type SalesAgentResult = {
  answer: string
  products: Array<{
    id?: string
    name: string
    brand: string | null
    category: string | null
    image: string | null
    price: number
    totalStock: number
    sizes: string[]
    colors: string[]
  }>
  tracking: SalesAgentTracking
}

type LanguageStyle = 'darija' | 'arabic' | 'french' | 'english'

export type SalesAgentTracking = {
  requestedProduct: string | null
  requestedBrand: string | null
  requestedCategory: string | null
  requestedSize: string | null
  requestedColor: string | null
  matchedProductId: string | null
  isUnavailable: boolean
}

function detectLanguageStyle(message: string): LanguageStyle {
  if (/[اأإآء-ي]/.test(message)) return /واش|كاين|بشحال|عندكم|بغيت|ديال/.test(message) ? 'darija' : 'arabic'
  if (/\b(salam|wach|kayn|kayna|kaynin|likaynin|likynin|bghit|chhal|dyal|chno|chnou|sebrila|sebrdila|sberdila|sendala|sandala|sbat|sabbat)\b/i.test(message)) return 'darija'
  if (/\b(bonjour|prix|taille|pointure|livraison|couleur|disponible|avez)\b/i.test(message)) return 'french'
  return 'english'
}

function summarizeProducts(products: ProductSearchResult[]) {
  return products.slice(0, 5).map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    image: product.image,
    price: product.sizes.find((size) => size.quantity > 0)?.price ?? product.basePrice,
    totalStock: product.totalStock,
    sizes: product.sizes.filter((size) => size.quantity > 0).map((size) => `${size.size} (${size.quantity})`),
    colors: product.colors,
  }))
}

function buildTracking(search: ProductSearchResponse): SalesAgentTracking {
  const availableMatch = search.products.find((product) =>
    search.intent.size
      ? product.sizes.some(
          (size) => size.size.toLowerCase() === search.intent.size?.toLowerCase() && size.quantity > 0,
        )
      : product.totalStock > 0,
  )
  const firstRequested = search.products[0] ?? search.alternatives[0]

  return {
    requestedProduct:
      [search.intent.brand, search.intent.category].filter(Boolean).join(' ') ||
      search.intent.terms.join(' ') ||
      firstRequested?.name ||
      null,
    requestedBrand: search.intent.brand ?? firstRequested?.brand ?? null,
    requestedCategory: search.intent.category ?? firstRequested?.category ?? null,
    requestedSize: search.intent.size ?? null,
    requestedColor: search.intent.color ?? null,
    matchedProductId: availableMatch?.id ?? null,
    isUnavailable: !availableMatch,
  }
}

function productLine(product: ProductSearchResult, requestedSize?: string) {
  const matchingSize = requestedSize
    ? product.sizes.find((size) => size.size.toLowerCase() === requestedSize.toLowerCase())
    : product.sizes.find((size) => size.quantity > 0)
  const availableSizes = product.sizes.filter((size) => size.quantity > 0).map((size) => size.size)
  const price = matchingSize?.price ?? product.basePrice

  return {
    title: [product.brand, product.name].filter(Boolean).join(' '),
    quantity: matchingSize?.quantity ?? product.totalStock,
    price,
    size: matchingSize?.size,
    availableSizes,
    colors: product.colors,
  }
}

function hasAvailableRequestedStock(product: ProductSearchResult, requestedSize?: string) {
  if (!requestedSize) return product.totalStock > 0

  return product.sizes.some(
    (size) => size.size.toLowerCase() === requestedSize.toLowerCase() && size.quantity > 0,
  )
}

function joinList(values: string[]) {
  return values.length ? values.join(', ') : ''
}

function formatMad(amount: number) {
  return formatCurrency(amount).replace('MAD', 'درهم')
}

function colorSentence(colors: string[], style: LanguageStyle) {
  if (!colors.length) return ''
  const list = joinList(colors)
  if (style === 'french') return ` Couleurs: ${list} 🎨.`
  return ` الألوان: ${list} 🎨.`
}

function deliveryAnswer(style: LanguageStyle) {
  if (style === 'french') return 'Oui، كاينة livraison فالمغرب 🚚 صيفط لينا المدينة ونأكدو ليك التفاصيل.'
  if (style === 'arabic') return 'نعم، كاين التوصيل داخل المغرب 🚚 أرسل لينا المدينة ونأكدو التفاصيل.'
  return 'إيه كاين التوصيل فالمغرب 🚚 صيفط لينا المدينة ونأكدو ليك التفاصيل.'
}

function isBroadCategoryRequest(search: ProductSearchResponse) {
  return Boolean(search.intent.category && !search.intent.brand && !search.intent.size && !search.intent.color && !search.intent.asksPrice)
}

function broadCategoryAnswer(products: ProductSearchResult[], style: LanguageStyle) {
  const available = products.filter((product) => product.totalStock > 0).slice(0, 3)
  if (!available.length) return null

  const lines = available.map((product) => {
    const line = productLine(product)
    const sizes = line.availableSizes.length ? joinList(line.availableSizes.slice(0, 5)) : 'stock limite'
    return `${line.title} (${sizes}) - ${formatMad(line.price)}`
  })

  if (style === 'french') return `Disponible دابا: ${lines.join('; ')}. شنو taille بغيتي؟`
  if (style === 'arabic') return `المتوفر دابا: ${lines.join('; ')}. شنو المقاس اللي بغيتي؟`
  return `كاين دابا: ${lines.join('; ')}. شنو المقاس اللي بغيتي؟`
}

function unavailableAnswer(search: ProductSearchResponse, style: LanguageStyle) {
  const sameProductWithOtherSizes = search.intent.size
    ? search.products.find((product) =>
        product.sizes.some(
          (size) => size.size.toLowerCase() !== search.intent.size?.toLowerCase() && size.quantity > 0,
        ),
      )
    : null
  const alternative = sameProductWithOtherSizes ?? search.alternatives.find((product) => product.totalStock > 0)
  const altLine = alternative ? productLine(alternative, undefined) : null
  const requestedSize = search.intent.size

  if (style === 'french') {
    if (sameProductWithOtherSizes && altLine) {
      return `Taille ${requestedSize} ماكايناش دابا، ولكن نفس الموديل كاين فـ ${joinList(altLine.availableSizes)}. الثمن ${formatMad(altLine.price)} 💰`
    }
    return altLine
      ? `هاد الموديل ماكاينش دابا، ولكن كاين بديل زوين: ${altLine.title} (${joinList(altLine.availableSizes)}) بثمن ${formatMad(altLine.price)} 👟`
      : 'هاد الموديل ماكاينش دابا، وما لقيتش بديل متوفر فالمخزون.'
  }

  if (style === 'arabic') {
    if (sameProductWithOtherSizes && altLine) {
      return `المقاس ${requestedSize} ماكاينش دابا، ولكن نفس الموديل كاين فـ ${joinList(altLine.availableSizes)}. الثمن ${formatMad(altLine.price)} 💰`
    }
    return altLine
      ? `هاد الموديل ماكاينش دابا، ولكن كاين بديل زوين: ${altLine.title} (${joinList(altLine.availableSizes)}) بثمن ${formatMad(altLine.price)} 👟`
      : 'هاد الموديل ماكاينش دابا، وما لقيتش بديل متوفر فالمخزون.'
  }

  if (style === 'darija') {
    if (sameProductWithOtherSizes && altLine) {
      return `المقاس ${requestedSize} سالا، ولكن نفس الموديل كاين فـ ${joinList(altLine.availableSizes)}. الثمن ${formatMad(altLine.price)} 💰`
    }
    return altLine
      ? `هاد الموديل ماكاينش دابا، ولكن كاين بديل زوين: ${altLine.title} (${joinList(altLine.availableSizes)}) بثمن ${formatMad(altLine.price)} 👟`
      : 'حالياً هاد الاختيار ما متوفرش، وما لقيتش بديل فالمخزون.'
  }

  if (sameProductWithOtherSizes && altLine) {
    return `Size ${requestedSize} ماكايناش دابا، ولكن نفس الموديل كاين فـ ${joinList(altLine.availableSizes)}. الثمن ${formatMad(altLine.price)} 💰`
  }

  return altLine
    ? `هاد الموديل ماكاينش دابا، ولكن كاين بديل زوين: ${altLine.title} (${joinList(altLine.availableSizes)}) بثمن ${formatMad(altLine.price)} 👟`
    : 'هاد الموديل ماكاينش دابا، وما لقيتش بديل متوفر فالمخزون.'
}

function ruleBasedAnswer(message: string, search: ProductSearchResponse) {
  const style = detectLanguageStyle(message)
  if (search.intent.asksDelivery && search.products.length === 0) return deliveryAnswer(style)

  const available = search.products.find((product) => hasAvailableRequestedStock(product, search.intent.size))

  if (!available) return unavailableAnswer(search, style)

  if (isBroadCategoryRequest(search)) {
    const answer = broadCategoryAnswer(search.products, style)
    if (answer) return answer
  }

  const line = productLine(available, search.intent.size)
  const colorText = colorSentence(line.colors, style)
  const sizesText = line.availableSizes.length ? joinList(line.availableSizes) : 'limited stock'

  if (search.intent.asksColors && !line.colors.length) {
    if (style === 'french') return `${line.title} كاين en stock، ولكن couleurs ما مفصولاش فالمخزون. Tailles: ${sizesText}. الثمن ${formatMad(line.price)} 💰`
    return `${line.title} كاين، ولكن الألوان ما مفصولاش فالمخزون. المقاسات المتوفرة: ${sizesText}. الثمن ${formatMad(line.price)} 💰`
  }

  if (search.intent.asksPrice && !search.intent.size) {
    if (style === 'french') return `${line.title} disponible دابا. الثمن هو ${formatMad(line.price)} 💰 Tailles: ${sizesText}.`
    return `${line.title} كاين دابا. الثمن هو ${formatMad(line.price)} 💰 المقاسات: ${sizesText}.`
  }

  if (style === 'french') return `Oui كاين ${line.title}${line.size ? ` size ${line.size}` : ''} ✅ الثمن ${formatMad(line.price)} 💰 Tailles: ${sizesText}.${colorText} بغيتي نوجدوه ليك؟ 🤝`
  if (style === 'arabic') return `نعم كاين ${line.title}${line.size ? ` size ${line.size}` : ''} ✅ الثمن ${formatMad(line.price)} 💰 المقاسات: ${sizesText}.${colorText} بغيتي نوجدوه ليك؟ 🤝`
  if (style === 'darija') return `نعم كاين ${line.title}${line.size ? ` size ${line.size}` : ''} ✅ الثمن ${formatMad(line.price)} 💰 المقاسات: ${sizesText}.${colorText} بغيتي نوجدوه ليك؟ 🤝`

  return `كاين ${line.title}${line.size ? ` size ${line.size}` : ''} ✅ الثمن ${formatMad(line.price)} 💰 المقاسات: ${sizesText}.${colorText} بغيتي نوجدوه ليك؟ 🤝`
}

async function openAiAnswer(message: string, search: ProductSearchResponse) {
  if (!process.env.OPENAI_API_KEY) return null

  const productSummary = summarizeProducts(search.products)
  const alternativeSummary = summarizeProducts(search.alternatives)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 180,
        messages: [
          {
            role: 'system',
            content:
              'You are StockMaster sales assistant for Moroccan customers. Default every customer reply to short natural Moroccan Darija. If the customer writes French, use Darija with a simple French mix. If Arabic fusha, use understandable Darija/Arabic. Use light emojis. Use only the product summary provided. Never invent prices, stock, sizes, colors, delivery fees, or delivery time. If unavailable, suggest alternatives from the provided alternatives only. End with a polite purchase nudge like "بغيتي نوجدوه ليك؟".',
          },
          {
            role: 'user',
            content: JSON.stringify({
              customerMessage: message,
              detectedIntent: search.intent,
              products: productSummary,
              alternatives: alternativeSummary,
            }),
          },
        ],
      }),
    })

    if (!response.ok) return null

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

export async function answerSalesAgent(message: string): Promise<SalesAgentResult> {
  const sanitized = sanitizeSalesMessage(message)
  const search = await searchProducts(sanitized)
  const aiAnswer = await openAiAnswer(sanitized, search)

  return {
    answer: aiAnswer || ruleBasedAnswer(sanitized, search),
    products: summarizeProducts(search.products.length ? search.products : search.alternatives),
    tracking: buildTracking(search),
  }
}
