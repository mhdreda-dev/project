import { NextRequest, NextResponse } from "next/server";
import { answerSalesAgent } from "@/lib/ai/sales-agent";

export const runtime = "nodejs";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

type WhatsAppMessage = {
  from: string;
  id: string;
  type: string;
  text?: {
    body?: string;
  };
};

async function sendWhatsAppMessage(to: string, message: string) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error("Missing WhatsApp env variables");
  }

  const response = await fetch(
    `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: message.slice(0, 4000),
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("WhatsApp send error:", errorText);
    throw new Error("Failed to send WhatsApp message");
  }

  return response.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Webhook verification failed" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0] as WhatsAppMessage | undefined;

    if (!message) {
      return NextResponse.json({ success: true });
    }

    if (message.type !== "text") {
      await sendWhatsAppMessage(
        message.from,
        "Salam 👋 دابا كنقدر نجاوب غير على الرسائل النصية. كتب ليا شنو بغيتي نقلب ليك عليه."
      );

      return NextResponse.json({ success: true });
    }

    const text = message.text?.body?.trim();

    if (!text) {
      return NextResponse.json({ success: true });
    }

    const result = await answerSalesAgent(text);

    await sendWhatsAppMessage(message.from, result.answer);

    return NextResponse.json({
      success: true,
      answer: result.answer,
    });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);

    return NextResponse.json(
      { error: "WhatsApp webhook failed" },
      { status: 500 }
    );
  }
}