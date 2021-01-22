const SECRET = process.env.secret || 'ShdmfAjdCjdDl'
const PORT = process.env.PORT || 8080
const TClientid = 'jqrenqwmu7mrkb5mrtp6ga2d90lzxn'
const TClientsecret = 'm2ide0j5hoo15k1d61kamret6rw05f'

const knex = require('knex')
const express = require('express')
const multer = require('multer')
const { createServer } = require('http')
const path = require('path').resolve()
const superagent = require('superagent')
const passport = require('passport')
const socket = require('socket.io')
const crs = require('crypto-random-string')
const jwt = require('jsonwebtoken')
const auth = require('./middlewares/auth')
const twitchStrategy = require("passport-twitch-new").Strategy
const app = express()
const cookieParser = require('cookie-parser')
const db = knex({ client: 'mysql', connection: { host: 'localhost', user:'tcpd', database: 'tcpd' } })
const cors = require('cors')
const { renderFile: render } = require('ejs')
const srv = createServer(app)
const wss = socket(srv)

app.use('/uploads', express.static(path + '/uploads'))
app.use('/public', express.static(path + '/public'))
app.use(express.urlencoded({extended:false}))
app.use(passport.initialize())
app.set('jwt-secret', SECRET)
app.use(express.json())
app.use(cookieParser())
app.use(cors())

passport.use(new twitchStrategy({clientID:TClientid, clientSecret: TClientsecret, callbackURL: 'http://localhost:8080/auth/twitch', scope: 'user_read channel:read:redemptions'}, async (accessToken, refreshToken, profile, done) => {
  const [exist] = await db.where({ id:profile.id }).from('oauth').select('*')
  exist ? await db.update({ id:profile.id, oauth:accessToken }).from('oauth').select('*').where({ id:profile.id }) : await db.insert({ id:profile.id, oauth:accessToken }).from('oauth').select('*')
  return done(null, profile)
}))
passport.serializeUser((user, done) => { done(null, user)})
passport.deserializeUser((user, done) => { done(null, user)})

const storage = multer.diskStorage({destination: (req, file, cb) => cb(null, 'uploads/'), limits: { fileSize: 20 * 1024 * 1024 }, filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + file.originalname)})

app.get("/redirect/twitch", passport.authenticate("twitch"))
app.get("/auth/twitch", passport.authenticate("twitch", { failureRedirect: "/" }), async (req, res) => {
  const random = crs({length: 10, type: 'alphanumeric'})
  let { id, login, display_name, email } = req.user
  const [exist] = await db.where({ id }).from('users').select('*')
  if (!exist) { 
  await db.insert({ id, session: random, login, name:display_name, email }).from('users').select('*')
  user = { id, login, name:display_name, email, session: random }
  } else user = await { id: exist.id, login: exist.login, name: exist.name, email: exist.email, session: exist.session }
  jwt.sign({ id: user.id, login: user.login, name: user.name, email: user.email, session: user.session }, req.app.get('jwt-secret'), { expiresIn: '1d', issuer: 'noeul.codes', subject: 'userdata' }, (err, token) => {
  if (err) return res.send(err).status(500)
  return res.cookie('authorization', 'Bearer ' + token, { expires: new Date(Date.now() + 3600000 * 24 * 2) }).redirect('/dashboard')
  })
})

app.post('/upload/img', auth, (req, res) => {
  const { id } = req.query
  if (!id) return res.sendStatus(400)
  const upload = multer({ storage: storage, fileFilter: imageFilter }).single('profile')
  upload(req, res, async (err) => {
    if (req.fileValidationError) return res.send('<script>alert("지원되지 않는 포맷입니다 (gif,png,jpg)."); location.href="/dashboard"</script>')
    else if (!req.file) return res.send('<script>alert("파일을 선택해주세요."); location.href="/dashboard"</script>').status(400)
    else if (err instanceof multer.MulterError) return res.send(err).status(500)
    else if (err) return res.send(err).status(500)
    const [exist] = await db.where({ id }).select('*').from('pointimage')
    exist ? await db.update({ id, url:'/' + req.file.path, channelid: req.user.id }).select('*').from('pointimage').where({ id }) : await db.insert({ id, url:'/' + req.file.path, channelid: req.user.id }).select('*').from('pointimage')
    res.send('<script>alert("정상적으로 후원 이미지를 업로드 하였습니다."); location.href="/dashboard"</script>')
  })
})

app.get('/test', async (req, res) => {
  const user = await db.select('*').from('users')
  res.send(user)
})

app.get('/img/:id', async (req, res) => {
  const { id } = req.params
  if (!id) return res.sendStatus(404)
  const [exist] = await db.select('*').from('pointimage').where({ id })
  if (!exist) return res.redirect('/public/img/publicimg.png')
  res.redirect(exist.url)
})

app.get('/dashboard', auth, async (req, res) => {
  const [oauth] = await db.where({id:req.user.id}).from('oauth').select('*')
  if (!oauth) return res.redirect('/redirect/twitch')
  superagent.get('https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=' + req.user.id).set({ 'Client-Id': TClientid, 'Authorization': 'Bearer ' +  oauth.oauth}).then( async (_res) => {
    JSON.parse(_res.text()).data.forEach( async (v,i) => {
      const [exist] = await db.insert({ id: v.id, title: v.title, bid: v.broadcaster_id }).from('point2name').select('*')
      exist ? await db.update({ title: v.title }).from('point2name').select('*').where({ id: v.id, bid: v.broadcaster_id}) : await db.insert({ id: v.id, title: v.title, bid: v.broadcaster_id }).from('point2name').select('*')
    })
    const str = await render(path + '/page/dashboard.ejs', { reward:JSON.parse(_res.text), user:req.user, setting:{url:'https://tcpd.noeul.codes/'} })
    res.send(str)
  }).catch(() => res.send('<script>alert("채널포인트를 사용할수 없는 스트리머이거나, 트위치 연결중 오류가 발생했습니다. 나중에 다시 시도해주세요."); location.href="/"</script>'))
})

app.get('/widget/:code', async (req, res) => {
  const { code } = req.params
  if (!code) return res.redirect('/')
  const [exist] = await db.where({ session:code }).from('users').select('*')
  if (!exist) return res.redirect('/')
  const str = await render(path + '/page/widget.ejs', { user: exist.login })
  res.send(str)
})

wss.on('connection', (socket) => {
  socket.on("point", async (uid, message) => {
    const [points] = await db.where({ id:message }).from('point2name').select('*')
    const random = crs({length: 10, type: 'alphanumeric'})
    !points ? socket.emit(uid, '채널 포인트', random) : socket.emit(uid, points.title, random) 
  })
})

srv.listen(PORT, () => console.log('server is now online'))

function imageFilter (req, file, cb) {
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
      req.fileValidationError = '사진만 등록할수 있습니다!'
      return cb(new Error('사진만 등록할수 있습니다!'), false)
  } cb(null, true)
}
