import { getAdminProfile, verifyAdmin } from '../auth.js'

export async function login(req, res, next) {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!email.trim() || !password) {
      return res.status(400).json({ message: 'Email dan kata sandi wajib diisi.' })
    }

    const user = await verifyAdmin(email, password)
    if (!user) return res.status(401).json({ message: 'Email atau kata sandi salah.' })

    req.session.regenerate((error) => {
      if (error) return next(error)
      req.session.adminId = user.id
      req.session.save((saveError) => {
        if (saveError) return next(saveError)
        res.json({ user })
      })
    })
  } catch (error) {
    next(error)
  }
}

export async function currentUser(req, res, next) {
  try {
    const { rows } = await getAdminProfile()
    const admin = rows[0]
    if (!admin) {
      req.session.destroy(() => {})
      return res.status(401).json({ message: 'Akun admin tidak tersedia.' })
    }
    res.json({ user: { id: 'global-admin', email: admin.email, nama: admin.display_name } })
  } catch (error) {
    next(error)
  }
}

export function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error)
    res.clearCookie('b2g.sid')
    res.status(204).end()
  })
}
