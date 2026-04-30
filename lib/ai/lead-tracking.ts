import { db } from '@/lib/db'
import { SalesAgentTracking } from '@/lib/ai/sales-agent'

type SaveSalesAgentEventInput = {
  message: string
  answer: string
  tracking: SalesAgentTracking
  ipAddress?: string
  userAgent?: string | null
  source?: string
}

function extractEmail(message: string) {
  return message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() ?? null
}

function extractPhone(message: string) {
  const match = message.match(/(?:\+?212|0)?[\s.-]?[5-7](?:[\s.-]?\d){8}\b/)
  if (!match) return null

  return match[0].replace(/[^\d+]/g, '')
}

function extractName(message: string) {
  const match =
    message.match(/\b(?:name is|my name is|je suis|ana|smiti|smiya dyali)\s+([a-zA-Z\s]{2,40})/i) ??
    message.match(/(?:اسمي|أنا)\s+([\p{L}\s]{2,40})/u)

  return match?.[1]?.trim().replace(/\s+/g, ' ') ?? null
}

function shouldCreateLead(message: string, email: string | null, phone: string | null) {
  if (email || phone) return true
  return /reserve|buy|order|interested|contact|call me|commande|acheter|reserver|réserver|interesse|intéressé|بغيت نشري|نحجز|تاصل|اتصل|عيط/i.test(
    message,
  )
}

export async function saveSalesAgentEvent(input: SaveSalesAgentEventInput) {
  const email = extractEmail(input.message)
  const phone = extractPhone(input.message)
  const name = extractName(input.message)

  await db.$transaction(async (tx) => {
    const conversation = await tx.aiConversation.create({
      data: {
        message: input.message,
        answer: input.answer,
        requestedProduct: input.tracking.requestedProduct,
        requestedBrand: input.tracking.requestedBrand,
        requestedCategory: input.tracking.requestedCategory,
        requestedSize: input.tracking.requestedSize,
        requestedColor: input.tracking.requestedColor,
        matchedProductId: input.tracking.matchedProductId,
        isUnavailable: input.tracking.isUnavailable,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent ?? null,
        source: input.source ?? 'website',
      },
    })

    if (shouldCreateLead(input.message, email, phone)) {
      await tx.aiLead.create({
        data: {
          conversationId: conversation.id,
          name,
          phone,
          email,
          message: input.message,
          productName: input.tracking.requestedProduct,
          size: input.tracking.requestedSize,
          color: input.tracking.requestedColor,
          source: input.source ?? 'website',
        },
      })
    }
  })
}
