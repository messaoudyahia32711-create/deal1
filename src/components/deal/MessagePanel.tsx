'use client'

import { useState, useEffect, useRef } from 'react'
import { t, type Language } from '@/lib/i18n'
import { type Message, useAppStore } from '@/lib/store'
import { Send, ArrowRight, Plus, Search, MessageCircle, Loader2, Image as ImageIcon, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface MessagePanelProps {
  userId: string
  userRole: string
  language: Language
}

interface Conversation {
  partnerId: string
  partnerName: string
  partnerAvatar: string | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

interface UserOption {
  id: string
  username: string
  role: string
  avatar: string | null
}

export default function MessagePanel({ userId, userRole, language }: MessagePanelProps) {
  const { contactOwnerId, contactOwnerName, setContactOwner } = useAppStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activePartner, setActivePartner] = useState<UserOption | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [searchUsers, setSearchUsers] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isArabic = language === 'ar'

  // Auto-open conversation with contact owner
  useEffect(() => {
    if (contactOwnerId && contactOwnerName) {
      const partner: UserOption = {
        id: contactOwnerId,
        username: contactOwnerName,
        role: '',
        avatar: null,
      }
      // Check if conversation already exists
      const existing = conversations.find(c => c.partnerId === contactOwnerId)
      if (existing) {
        openConversation(existing.partnerId, existing.partnerName, existing.partnerAvatar)
      } else {
        setActivePartner(partner)
        setMessages([])
      }
      // Clear contact owner state after opening
      setContactOwner(null, null)
    }
  }, [contactOwnerId, contactOwnerName])

  // Load conversations
  async function loadConversations() {
    if (!userId) return
    try {
      const res = await fetch(`/api/messages?userId=${userId}`)
      const data = await res.json()
      const allMessages: Message[] = data.data || []

      // Group by partner
      const convMap = new Map<string, Conversation>()
      for (const msg of allMessages) {
        const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId
        const partnerName = msg.senderId === userId ? msg.receiverName : msg.senderName
        const partnerAvatar = msg.senderId === userId ? (msg as any).senderAvatar : (msg as any).senderAvatar

        const existing = convMap.get(partnerId)
        const msgTime = new Date(msg.createdAt).getTime()
        const existingTime = existing ? new Date(existing.lastMessageTime).getTime() : 0

        if (!existing || msgTime > existingTime) {
          convMap.set(partnerId, {
            partnerId,
            partnerName: partnerName || 'مستخدم',
            partnerAvatar: partnerAvatar || null,
            lastMessage: msg.content.slice(0, 50),
            lastMessageTime: msg.createdAt,
            unreadCount: (existing?.unreadCount || 0) + (msg.receiverId === userId && !msg.isRead ? 1 : 0),
          })
        } else if (msg.receiverId === userId && !msg.isRead) {
          existing.unreadCount += 1
        }
      }

      const convList = Array.from(convMap.values()).sort(
        (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      )
      setConversations(convList)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  // Load messages with a partner
  async function loadMessages(partnerId: string) {
    try {
      const res = await fetch(`/api/messages?userId=${userId}&partnerId=${partnerId}`)
      const data = await res.json()
      setMessages(data.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  // Load users for new message dialog
  async function loadUsers() {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      const userList: UserOption[] = (data.data || [])
        .filter((u: any) => u.id !== userId)
        .map((u: any) => ({
          id: u.id,
          username: u.username,
          role: u.role,
          avatar: u.avatar || null,
        }))
      setUsers(userList)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [userId])

  useEffect(() => {
    if (activePartner) {
      loadMessages(activePartner.id)
    }
  }, [activePartner?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Open conversation with partner
  function openConversation(partnerId: string, partnerName: string, partnerAvatar: string | null) {
    setActivePartner({ id: partnerId, username: partnerName, avatar: partnerAvatar, role: '' })
    setMessages([])
  }

  // Start new conversation
  function startNewConversation(user: UserOption) {
    setShowNewDialog(false)
    setSearchUsers('')
    // Check if conversation already exists
    const existing = conversations.find(c => c.partnerId === user.id)
    if (existing) {
      openConversation(existing.partnerId, existing.partnerName, existing.partnerAvatar)
    } else {
      setActivePartner(user)
      setMessages([])
    }
  }

  // Send message
  async function sendMessage() {
    if (!newMessage.trim() && !selectedImage) return
    if (!activePartner) return

    setSending(true)
    try {
      let imageUrl: string | null = null

      // Upload image if selected
      if (selectedImage) {
        setUploading(true)
        const formData = new FormData()
        formData.append('file', selectedImage)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (uploadData.data?.url) {
          imageUrl = uploadData.data.url
        }
        setUploading(false)
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userId,
          receiverId: activePartner.id,
          content: newMessage.trim() || (imageUrl ? '📷' : ''),
          imageUrl,
        }),
      })
      const data = await res.json()

      if (data.data) {
        setMessages(prev => [...prev, data.data])
        setNewMessage('')
        setSelectedImage(null)
        setImagePreview(null)
      }

      // Refresh conversations
      loadConversations()
    } catch (e) {
      console.error(e)
    }
    setSending(false)
  }

  // Handle image selection
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      return
    }

    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Format time
  function formatTime(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (mins < 1) return isArabic ? 'الآن' : 'maintenant'
    if (mins < 60) return isArabic ? `منذ ${mins} دقيقة` : `il y a ${mins} min`
    if (hours < 24) return isArabic ? `منذ ${hours} ساعة` : `il y a ${hours}h`
    if (days < 7) return isArabic ? `منذ ${days} يوم` : `il y a ${days}j`
    return date.toLocaleDateString(isArabic ? 'ar-DZ' : 'fr-DZ')
  }

  // Get role emoji
  function roleEmoji(role: string) {
    switch (role) {
      case 'admin': return '👑'
      case 'merchant': return '🏪'
      case 'service_provider': return '🔧'
      default: return '👤'
    }
  }

  // Chat view
  if (activePartner) {
    return (
      <div className="flex flex-col h-[70vh] bg-white rounded-xl shadow-sm border overflow-hidden" dir={isArabic ? 'rtl' : 'ltr'}>
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-l from-purple-50 to-pink-50">
          <button
            onClick={() => { setActivePartner(null); setMessages([]) }}
            className="w-9 h-9 rounded-lg bg-white shadow flex items-center justify-center hover:bg-gray-50 transition"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {activePartner.username?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <div className="font-bold">{activePartner.username}</div>
            <div className="text-xs text-gray-400">
              {roleEmoji(activePartner.role)} {activePartner.role === 'merchant' ? t('merchant', language) : activePartner.role === 'service_provider' ? t('serviceProvider', language) : activePartner.role === 'admin' ? t('admin', language) : t('customer', language)}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">{t('noConversations', language)}</p>
              <p className="text-sm mt-1">{t('sendMessage', language)}</p>
            </div>
          ) : (
            messages.map(msg => {
              const isSent = msg.senderId === userId
              return (
                <div key={msg.id} className={`flex ${isSent ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] ${isSent ? 'msg-bubble-sent' : 'msg-bubble-received'}`}>
                    {msg.imageUrl && (
                      <div className="mb-2">
                        <img src={msg.imageUrl} alt="" className="rounded-lg max-w-full max-h-48 object-cover" />
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <div className={`text-[10px] mt-1 ${isSent ? 'text-white/70' : 'text-gray-400'}`}>
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="px-4 pb-2">
            <div className="relative inline-block">
              <img src={imagePreview} alt="" className="w-16 h-16 rounded-lg object-cover border-2 border-purple-200" />
              <button
                onClick={() => { setSelectedImage(null); setImagePreview(null) }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-3 border-t bg-gray-50/50">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition text-gray-500"
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            </button>
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={t('typeMessage', language)}
              className="flex-1 rounded-xl"
              dir={isArabic ? 'rtl' : 'ltr'}
            />
            <button
              onClick={sendMessage}
              disabled={sending || (!newMessage.trim() && !selectedImage)}
              className="btn-3d btn-3d-primary px-4 py-2 disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Conversation List View
  return (
    <div dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header with New Message button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black flex items-center gap-2">
          💬 {t('chat', language)}
        </h2>
        <Button
          onClick={() => { setShowNewDialog(true); loadUsers() }}
          className="btn-3d btn-3d-primary text-sm"
        >
          <Plus className="w-4 h-4" /> {t('newMessage', language)}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-400 mb-2" />
          <p className="text-gray-400 text-sm">{t('loading', language)}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && conversations.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-400">{t('noConversations', language)}</h3>
            <p className="text-gray-300 mt-2 text-sm">{t('sendMessage', language)}</p>
            <Button
              onClick={() => { setShowNewDialog(true); loadUsers() }}
              className="btn-3d btn-3d-primary mt-4"
            >
              <Plus className="w-4 h-4" /> {t('newMessage', language)}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Conversation list */}
      {!loading && conversations.length > 0 && (
        <div className="grid gap-2 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {conversations.map(conv => (
            <Card
              key={conv.partnerId}
              className="shadow-sm cursor-pointer hover:shadow-md hover:border-purple-200 transition-all"
              onClick={() => openConversation(conv.partnerId, conv.partnerName, conv.partnerAvatar)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {conv.partnerName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{conv.partnerName}</span>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5">{conv.unreadCount}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {formatTime(conv.lastMessageTime)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Message Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md" dir={isArabic ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="font-black">{t('newMessage', language)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchUsers}
                onChange={e => setSearchUsers(e.target.value)}
                placeholder={isArabic ? 'ابحث عن مستخدم...' : 'Rechercher un utilisateur...'}
                className="pr-9 rounded-xl"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1" style={{ scrollbarWidth: 'thin' }}>
              {users
                .filter(u => !searchUsers || u.username.toLowerCase().includes(searchUsers.toLowerCase()))
                .map(u => (
                  <button
                    key={u.id}
                    onClick={() => startNewConversation(u)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition text-right"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                      {u.username.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{u.username}</div>
                      <div className="text-xs text-gray-400">
                        {roleEmoji(u.role)} {u.role === 'merchant' ? t('merchant', language) : u.role === 'service_provider' ? t('serviceProvider', language) : u.role === 'admin' ? t('admin', language) : t('customer', language)}
                      </div>
                    </div>
                  </button>
                ))
              }
              {users.filter(u => !searchUsers || u.username.toLowerCase().includes(searchUsers.toLowerCase())).length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  {t('noData', language)}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
