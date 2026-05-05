import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth - Login or Register
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'register') {
      return await register(body)
    }

    return await login(body)
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في المصادقة' },
      { status: 500 }
    )
  }
}

async function login(body: {
  email: string
  password: string
}) {
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json(
      { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
      { status: 400 }
    )
  }

  const user = await db.user.findUnique({
    where: { email },
  })

  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: 'بيانات الدخول غير صحيحة' },
      { status: 401 }
    )
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: 'هذا الحساب معطل' },
      { status: 403 }
    )
  }

  // Demo: just verify password is provided (no hash check)
  const { passwordHash, ...userWithoutPassword } = user

  return NextResponse.json({
    data: userWithoutPassword,
    message: 'تم تسجيل الدخول بنجاح',
  })
}

async function register(body: {
  username: string
  email: string
  password: string
  role: string
  phone?: string
  wilaya?: string
  storeName?: string
  specialty?: string
  experience?: number
}) {
  const { username, email, password, role, phone, wilaya, storeName, specialty, experience } = body

  if (!username || !email || !password || !role) {
    return NextResponse.json(
      { error: 'جميع الحقول المطلوبة يجب ملؤها' },
      { status: 400 }
    )
  }

  // Check if email already exists
  const existingUser = await db.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return NextResponse.json(
      { error: 'البريد الإلكتروني مستخدم بالفعل' },
      { status: 409 }
    )
  }

  // Check if username already exists
  const existingUsername = await db.user.findUnique({
    where: { username },
  })

  if (existingUsername) {
    return NextResponse.json(
      { error: 'اسم المستخدم مستخدم بالفعل' },
      { status: 409 }
    )
  }

  // Demo: store password as plain hash (not for production!)
  const passwordHash = `$2a$10$demo_${password}`

  const user = await db.user.create({
    data: {
      username,
      email,
      passwordHash,
      role,
      phone,
      wilaya,
      storeName: role === 'merchant' ? storeName : null,
      specialty: role === 'service_provider' ? specialty : null,
      experience: role === 'service_provider' ? experience : null,
    },
  })

  // Create wallet for merchants and service providers
  if (role === 'merchant' || role === 'service_provider') {
    await db.merchantWallet.create({
      data: {
        merchantId: user.id,
        balance: 0,
        totalEarned: 0,
        totalCommissionPaid: 0,
        pendingWithdrawal: 0,
      },
    })
  }

  const { passwordHash: _, ...userWithoutPassword } = user

  return NextResponse.json(
    { data: userWithoutPassword, message: 'تم إنشاء الحساب بنجاح' },
    { status: 201 }
  )
}
