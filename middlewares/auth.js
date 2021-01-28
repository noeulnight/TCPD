const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  const authHeader = req.cookies.authorization
  if (authHeader) {
    const token = authHeader.split(' ')[1]
    jwt.verify(token, req.app.get('jwt-secret'), async (err, user) => {
      if (err) return res.redirect('/')
      req.user = user
      next()
    })
  } else res.redirect('/')
}

module.exports = authMiddleware