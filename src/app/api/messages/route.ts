import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const partnerId = searchParams.get('partnerId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    let messages

    if (partnerId) {
      // Get messages between two specific users
      messages = await db.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        },
        include: {
          sender: { select: { id: true, username: true, avatar: true } },
          receiver: { select: { id: true, username: true, avatar: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
    } else {
      // Get all messages for the user
      messages = await db.message.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
        include: {
          sender: { select: { id: true, username: true, avatar: true } },
          receiver: { select: { id: true, username: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    const formatted = messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      content: msg.content,
      isRead: msg.isRead,
      imageUrl: msg.imageUrl,
      createdAt: msg.createdAt.toISOString(),
      senderName: msg.sender.username,
      receiverName: msg.receiver.username,
      senderAvatar: msg.sender.avatar || null,
    }))

    return NextResponse.json({ data: formatted })
  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { senderId, receiverId, content, imageUrl } = body

    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: 'senderId, receiverId, and content are required' }, { status: 400 })
    }

    const message = await db.message.create({
      data: {
        senderId,
        receiverId,
        content,
        imageUrl: imageUrl || null,
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
        receiver: { select: { id: true, username: true, avatar: true } },
      },
    })

    const formatted = {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      isRead: message.isRead,
      imageUrl: message.imageUrl,
      createdAt: message.createdAt.toISOString(),
      senderName: message.sender.username,
      receiverName: message.receiver.username,
      senderAvatar: message.sender.avatar || null,
    }

    return NextResponse.json({ data: formatted }, { status: 201 })
  } catch (error) {
    console.error('Messages POST error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
