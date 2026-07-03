import nodemailer from 'nodemailer'
import twilio from 'twilio'
import { config } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { getLowStockParts } from './inventory.js'

async function sendEmail(to: string, subject: string, body: string) {
  if (!config.alerts.smtp.host) {
    console.log(`[EMAIL MOCK] To: ${to} | ${subject}\n${body}`)
    return true
  }
  const transport = nodemailer.createTransport({
    host: config.alerts.smtp.host,
    port: config.alerts.smtp.port,
    auth: { user: config.alerts.smtp.user, pass: config.alerts.smtp.pass },
  })
  await transport.sendMail({ from: config.alerts.smtp.from, to, subject, text: body })
  return true
}

async function sendSms(to: string, body: string) {
  if (!config.alerts.twilio.accountSid) {
    console.log(`[SMS MOCK] To: ${to} | ${body}`)
    return true
  }
  const client = twilio(config.alerts.twilio.accountSid, config.alerts.twilio.authToken)
  await client.messages.create({ from: config.alerts.twilio.fromNumber, to, body })
  return true
}

export async function processLowStockAlerts() {
  const lowStockParts = await getLowStockParts()
  if (lowStockParts.length === 0) return { sent: 0, parts: 0 }

  const settings = await prisma.alertSetting.findMany({ where: { enabled: true } })
  const emailRecipients = settings.filter((s) => s.channel === 'EMAIL').map((s) => s.recipient)
  const smsRecipients = settings.filter((s) => s.channel === 'SMS').map((s) => s.recipient)

  if (emailRecipients.length === 0) emailRecipients.push(...config.alerts.emailRecipients)
  if (smsRecipients.length === 0) smsRecipients.push(...config.alerts.smsRecipients)

  const lines = lowStockParts.map((p) => {
    const locs = p.inventoryLevels.map((l) => `${l.location.code}: ${l.quantity}`).join(', ')
    return `• ${p.sku} — ${p.name}: ${p.totalQty} on hand (reorder at ${p.reorderPoint}) [${locs}]`
  })

  const subject = `[GreenLine] Low Stock Alert: ${lowStockParts.length} part(s)`
  const body = `The following parts are at or below reorder point:\n\n${lines.join('\n')}\n\n— GreenLine Inventory System`
  const smsBody = `GreenLine low stock: ${lowStockParts.length} parts need reorder. Check dashboard.`

  let sent = 0

  for (const email of emailRecipients) {
    try {
      await sendEmail(email, subject, body)
      await prisma.alertLog.create({
        data: { message: subject, channel: 'EMAIL', recipient: email, sent: true },
      })
      sent++
    } catch (err) {
      await prisma.alertLog.create({
        data: {
          message: subject,
          channel: 'EMAIL',
          recipient: email,
          sent: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      })
    }
  }

  for (const phone of smsRecipients) {
    try {
      await sendSms(phone, smsBody)
      await prisma.alertLog.create({
        data: { message: smsBody, channel: 'SMS', recipient: phone, sent: true },
      })
      sent++
    } catch (err) {
      await prisma.alertLog.create({
        data: {
          message: smsBody,
          channel: 'SMS',
          recipient: phone,
          sent: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      })
    }
  }

  return { sent, parts: lowStockParts.length }
}
