const SECRET = process.env.secret || 'KOLFDSOKF'
const PORT = process.env.PORT || 8001
const TClientid = 'jqrenqwmu7mrkb5mrtp6ga2d90lzxn'
const TClientsecret = 'm2ide0j5hoo15k1d61kamret6rw05f'

const knex = require('knex')
const express = require('express')
const { createServer } = require('http')
const path = require('path').resolve(__dirname)
const fetch = require('node-fetch')
const passport = require('passport')
const socket = require('socket.io')
const crs = require('crypto-random-string')
const jwt = require('jsonwebtoken')
const auth = require('./middlewares/auth')
const acctoken = require('./middlewares/token')
const twitchStrategy = require("passport-twitch-new").Strategy
const app = express()
const cookieParser = require('cookie-parser')
const db = knex({ client: 'mysql', connection: { host: 'tcpd.cafe24app.com', user:'soju07', password: 'so^ju!00*1206~', database: 'soju07' } })
const cors = require('cors')
const { renderFile: render } = require('ejs')
const srv = createServer(app)
const wss = socket(srv)

app.use('/public', express.static(path + '/public'))
app.use(express.urlencoded({extended:false}))
app.use(passport.initialize())
app.set('jwt-secret', SECRET)
app.use(express.json())
app.use(cookieParser())
app.use(cors())

passport.use(new twitchStrategy({clientID:TClientid, clientSecret: TClientsecret, callbackURL: 'http://twilow.ga/auth/twitch', scope: 'user_read channel:read:redemptions'}, async (accessToken, refreshToken, profile, done) => {
  let user
  const random = crs({length: 10, type: 'alphanumeric'})
  const [exist] = await db.where({ id: profile.id }).from('users').select('*')
  if (!exist) {
    await db.insert({ id: profile.id, session: random, login : profile.login, name:profile.display_name, email: profile.email, accesstoken: accessToken, refreshtoken: refreshToken }).from('users').select('*')
    user = { id: profile.id, session: random, login : profile.login, name:profile.display_name, email: profile.email, session: random }
  } else {
    await db.update({ id: profile.id, login : profile.login, name:profile.display_name, email: profile.email, accesstoken: accessToken, refreshtoken: refreshToken }).from('users').select('*').where({ id: exist.id })
    user = await { id: exist.id, login: exist.login, name: exist.name, email: exist.email, session: exist.session }
  }
  return done(null, user)
}))
passport.serializeUser((user, done) => { done(null, user)})
passport.deserializeUser((user, done) => { done(null, user)})

app.get("/redirect/twitch", passport.authenticate("twitch"))
app.get("/auth/twitch", passport.authenticate("twitch", { failureRedirect: "/" }), async (req, res) => {
  let { id, login, name, email, session } = req.user
  jwt.sign({ id, login, name, email, session }, req.app.get('jwt-secret'), { expiresIn: '1d', issuer: 'noeul.codes', subject: 'userdata' }, (err, token) => {
  if (err) return res.send(err).status(500)
  return res.cookie('authorization', 'Bearer ' + token, { expires: new Date(Date.now() + 3600000 * 24 * 2) }).redirect('/dashboard')
  })
})

app.post('/upload/img', auth, async (req, res) => {
  console.log(req.file)
  const { id } = req.query
  if (!id) return res.sendStatus(400)
  const [exist] = await db.where({ id }).select('*').from('pointimage')
  exist ? await db.update({ id, url:'/' + req.file.path, channelid: req.user.id }).select('*').from('pointimage').where({ id }) : await db.insert({ id, url:'/' + req.file.path, channelid: req.user.id }).select('*').from('pointimage')
  res.send('<script>alert("정상적으로 후원 이미지를 업로드 하였습니다."); location.href="/dashboard"</script>')
})

app.get('/img/:id', async (req, res) => {
  const { id } = req.params
  if (!id) return res.sendStatus(404)
  const [exist] = await db.select('*').from('pointimage').where({ id })
  if (!exist) return res.redirect('/public/img/publicimg.png')
  res.redirect(exist.url)
})

app.get('/', (req, res) => {
  res.send('<button type="button" onClick="location.href=\'/redirect/twitch\'"} >트위치 로그인!</button>')
})

const json = {
  data: [
    {
      broadcaster_name: '메탈킴',
      broadcaster_id: '46005422',
      id: '7761ed12-1b51-4dfd-89cf-6b34cd035e4d',
      image: null,
      background_color: '#BEFF00',
      is_enabled: true,
      cost: 1000,
      title: '자세 확인!',
      prompt: '자세를 똑바로 합니다',
      is_user_input_required: false,
      max_per_stream_setting: [Object],
      max_per_user_per_stream_setting: [Object],
      global_cooldown_setting: [Object],
      is_paused: false,
      is_in_stock: true,
      default_image: [Object],
      should_redemptions_skip_request_queue: false,
      redemptions_redeemed_current_stream: null,
      cooldown_expires_at: null
    },
    {
      broadcaster_name: '메탈킴',
      broadcaster_id: '46005422',
      id: '92effb15-e28e-4eb1-b998-516fabc26fba',
      image: null,
      background_color: '#00E5CB',
      is_enabled: true,
      cost: 3000,
      title: '수분 섭취!',
      prompt: '물 한 모금 마시기',
      is_user_input_required: false,
      max_per_stream_setting: [Object],
      max_per_user_per_stream_setting: [Object],
      global_cooldown_setting: [Object],
      is_paused: false,
      is_in_stock: true,
      default_image: [Object],
      should_redemptions_skip_request_queue: false,
      redemptions_redeemed_current_stream: null,
      cooldown_expires_at: null
    },
    {
      broadcaster_name: '메탈킴',
      broadcaster_id: '46005422',
      id: 'a1dba36f-e986-4c01-b235-6f3dd2d6a4e2',
      image: null,
      background_color: '#C6B3FF',
      is_enabled: true,
      cost: 4000,
      title: '스트레에에에에에에에칭',
      prompt: '스트레칭으로 관절을 풀어줍니다 - 고마워요!',
      is_user_input_required: false,
      max_per_stream_setting: [Object],
      max_per_user_per_stream_setting: [Object],
      global_cooldown_setting: [Object],
      is_paused: false,
      is_in_stock: true,
      default_image: [Object],
      should_redemptions_skip_request_queue: false,
      redemptions_redeemed_current_stream: null,
      cooldown_expires_at: null
    }
  ]
}

app.get('/dashboard', auth, acctoken, async (req, res) => {
  fetch('https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=' + req.user.id, {method:'GET', headers: { 'Client-Id': TClientid, 'authorization': 'Bearer ' + req.oauth }}).then(res => res.json()).then( async sjson => {
    // if (json.error) return res.send('<script>alert("채널포인트를 사용할수 없는 스트리머이거나, 트위치 연결중 오류가 발생했습니다. 나중에 다시 시도해주세요."); location.href="/"</script>')
    json.data.forEach( async (v,i) => {
      const [exist] = await db.where({ id: v.id, name: v.title, bid: v.broadcaster_id }).from('point2name').select('*')
      exist ? await db.update({ name: v.title }).from('point2name').select('*').where({ id: v.id, bid: v.broadcaster_id}) : await db.insert({ id: v.id, name: v.title, bid: v.broadcaster_id }).from('point2name').select('*')
    })
    const str = await render(path + '/page/dashboard.ejs', { reward:json, user:req.user, setting:{url:'https://tcpd.noeul.codes/widget/'} })
    res.send(str)
  })
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
  socket.on("ping", async (uid) => {
    const [user] = await db.where({ session: uid }).from('users').select('*')
    if (!user) return socket.emit(uid, false)
    const points = await db.where({ bid:user.id }).from('point2name').select('*')
    !points ? socket.emit(uid, false) : socket.emit(uid, points) 
  })
})

srv.listen(PORT, () => console.log('server is now online'))
