import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { contactSchema, b2bInquirySchema } from '@/lib/validations'
import { successResponse, errorResponse } from '@/lib/utils'
import { sendContactNotification, sendContactAutoReply } from '@/lib/email'
import { contactLimiter } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
    try {
        // Rate limit by IP (Upstash Redis-backed)
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown'
        const { success: rlOk } = await contactLimiter.limit(ip)
        if (!rlOk) {
            return errorResponse('Too many submissions. Please try again later.', 429)
        }

        const body = await request.json()
        const { type } = body

        if (type === 'B2B') {
            const parsed = b2bInquirySchema.safeParse(body)
            if (!parsed.success) return errorResponse(parsed.error.issues[0].message)

            const data = parsed.data

            const inquiry = await prisma.contactInquiry.create({
                data: {
                    name: data.contactPerson,
                    email: data.email,
                    phone: data.phone,
                    type: 'B2B',
                    subject: `B2B Inquiry: ${data.businessName}`,
                    message: `Business: ${data.businessName}\nType: ${data.businessType || 'N/A'}\nExpected Daily Qty: ${data.expectedDailyQty || 'N/A'} litres\n\n${data.message || ''}`,
                }
            })

            // If user is logged in, create B2B profile
            const user = await getAuthUser(request)
            if (user) {
                const existing = await prisma.b2BProfile.findUnique({ where: { userId: user.id } })
                if (!existing) {
                    await prisma.b2BProfile.create({
                        data: {
                            userId: user.id,
                            businessName: data.businessName,
                            businessType: data.businessType || 'Other',
                            contactPerson: data.contactPerson,
                            contactPhone: data.phone,
                            isApproved: false,
                        }
                    })
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { role: 'B2B' }
                    })
                }
            }

            // Send emails (fire and forget — don't block response)
            sendContactNotification({
                ticketNumber: inquiry.ticketNumber,
                name: data.contactPerson,
                email: data.email,
                phone: data.phone,
                subject: `B2B Inquiry: ${data.businessName}`,
                message: inquiry.message,
                type: 'B2B',
            }).catch(err => console.error('Support email failed:', err))

            sendContactAutoReply({
                name: data.contactPerson,
                email: data.email,
                ticketNumber: inquiry.ticketNumber,
            }).catch(err => console.error('Auto-reply failed:', err))

            // Audit log
            await prisma.auditLog.create({
                data: {
                    action: 'CONTACT_MESSAGE_CREATED',
                    entity: 'ContactInquiry',
                    entityId: inquiry.id,
                    details: `B2B inquiry from ${data.contactPerson} (${data.email})`,
                    ipAddress: ip,
                }
            }).catch(() => { }) // non-critical

            return successResponse({ message: 'B2B inquiry submitted successfully', ticketNumber: inquiry.ticketNumber }, 201)
        }

        // ─── General Contact ───
        const parsed = contactSchema.safeParse(body)
        if (!parsed.success) return errorResponse(parsed.error.issues[0].message)

        const data = parsed.data

        // Sanitize: strip any HTML tags from message and subject
        const sanitize = (str: string) => str.replace(/<[^>]*>/g, '')

        const inquiry = await prisma.contactInquiry.create({
            data: {
                name: sanitize(data.name),
                email: data.email,
                phone: data.phone || null,
                type: data.type || 'GENERAL',
                subject: data.subject ? sanitize(data.subject) : null,
                message: sanitize(data.message),
            }
        })

        // Send notification email to support team
        sendContactNotification({
            ticketNumber: inquiry.ticketNumber,
            name: data.name,
            email: data.email,
            phone: data.phone,
            subject: data.subject,
            message: data.message,
            type: data.type || 'GENERAL',
        }).catch(err => console.error('Support email failed:', err))

        // Send auto-reply to customer
        sendContactAutoReply({
            name: data.name,
            email: data.email,
            ticketNumber: inquiry.ticketNumber,
        }).catch(err => console.error('Auto-reply failed:', err))

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'CONTACT_MESSAGE_CREATED',
                entity: 'ContactInquiry',
                entityId: inquiry.id,
                details: `Contact from ${data.name} (${data.email}): ${data.subject || 'No subject'}`,
                ipAddress: ip,
            }
        }).catch(() => { })

        return successResponse({ message: 'Message sent successfully! Check your email for confirmation.', ticketNumber: inquiry.ticketNumber }, 201)
    } catch (error) {
        console.error('Contact POST error:', error)
        return errorResponse('Failed to submit inquiry', 500)
    }
}
