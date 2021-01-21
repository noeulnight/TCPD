const SECRET = process.env.secret || 'ShdmfAjdCjdDl'
const PORT = process.env.PORT || 8080
const TClientid = 'jqrenqwmu7mrkb5mrtp6ga2d90lzxn'
const TClientsecret = 'm2ide0j5hoo15k1d61kamret6rw05f'

const knex = require('knex')
const express = require('express')
const multer = require('multer')
const path = require('path').resolve()
const superagent = require('superagent')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const auth = require('./middlewares/auth')
const twitchStrategy = require("passport-twitch-new").Strategy
const app = express()
const cookieParser = require('cookie-parser')
const db = knex({ client: 'mysql', connection: { host: 'localhost', user:'tcpd', database: 'tcpd' } })
const cors = require('cors')
const { renderFile: render } = require('ejs')

app.use(express.urlencoded({extended:false}))
app.use(passport.initialize())
app.set('jwt-secret', SECRET)
app.use(express.json())
app.use(cookieParser())
app.use(cors())

passport.use(new twitchStrategy({clientID:TClientid, clientSecret: TClientsecret, callbackURL: 'http://localhost:8080/auth/twitch', scope: 'user_read channel:read:redemptions'}, async (accessToken, refreshToken, profile, done) => {
  await db.insert({ id:profile.id, oauth:accessToken }).from('oauth').select('*').catch( async () => {
    await db.update({ id:profile.id, oauth:accessToken }).from('oauth').select('*')
  })
  return done(null, profile)
}))
passport.serializeUser((user, done) => { done(null, user)})
passport.deserializeUser((user, done) => { done(null, user)})

const storage = multer.diskStorage({destination: (req, file, cb) => cb(null, 'uploads/'), filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + file.originalname)})

app.get("/redirect/twitch", passport.authenticate("twitch"))
app.get("/auth/twitch", passport.authenticate("twitch", { failureRedirect: "/" }), async (req, res) => {
  const { id, login, display_name, email } = req.user
  const [exist] = await db.where({ id }).from('users').select('*')
  if (!exist) { 
  await db.insert({ id, login, name:display_name, email }).from('users').select('*')
  user = { id, login, name:display_name, email }
  } else user = await { id: exist.id, login: exist.login, name: exist.name, email: exist.email }
  jwt.sign({ id: user.id, login: user.login, name: user.name, email: user.email }, req.app.get('jwt-secret'), { expiresIn: '1d', issuer: 'noeul.codes', subject: 'userdata' }, (err, token) => {
  if (err) return res.send(err).status(500)
  return res.cookie('authorization', 'Bearer ' + token, { expires: new Date(Date.now() + 3600000 * 24 * 2) }).redirect('/dashboard')
  })
})

app.post('/upload/img', auth, (req, res) => {
  const { id } = req.query
  if (!id) return res.sendStatus(400)
  const upload = multer({ storage: storage, fileFilter: imageFilter }).single('profile')
  upload(req, res, async (err) => {
    if (req.fileValidationError) return res.send(req.fileValidationError).status(400)
    else if (!req.file) return res.send('Please select an image to upload').status(400)
    else if (err instanceof multer.MulterError) return res.send(err).status(500)
    else if (err) return res.send(err).status(500)
    await db.insert({ id, url:'/' + req.file.path, channelid: req.user.id }).catch(async () => {await db.update({ id, url:'/' + req.file.path, channelid: req.user.id })})
    res.sendStatus(200)
  })
})

app.get('/dashboard', auth, async (req, res) => {
  const [oauth] = await db.where({id:req.user.id}).from('oauth').select('*')
  superagent.get('https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=' + req.user.id).set({ 'Client-Id': TClientid, 'Authorization': 'Bearer ' +  oauth.oauth}).then( async (_res) => {
    console.log(JSON.parse(_res.text))
    const str = await render(path + '/page/dashboard.ejs')
    res.send(str)
  }).catch(() => res.send('<script>alert("채널포인트를 사용할수 없는 스트리머이거나, 트위치 연결중 오류가 발생했습니다. 나중에 다시 시도해주세요."); location.href="/"</script>'))
})

app.listen(PORT, () => console.log('server is now online'))

module.exports.imageFilter = function(req, file, cb) {
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
      req.fileValidationError = 'Only image files are allowed!'
      return cb(new Error('Only image files are allowed!'), false)
  } cb(null, true)
}
