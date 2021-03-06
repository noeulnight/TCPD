const knex = require('knex')
const db = knex({ client: 'mysql', connection: { host: 'tcpd.cafe24app.com', user:'soju07', password: 'so^ju!00*1206~', database: 'soju07' } })
const fetch = require('node-fetch')

const TClientid = 'jqrenqwmu7mrkb5mrtp6ga2d90lzxn'
const TClientsecret = 'm2ide0j5hoo15k1d61kamret6rw05f'

const tokenMiddleware = async (req, res, next) => {
  const authHeader = req.cookies.authorization
  if (authHeader) {
    const [user] = await db.where({id : req.user.id}).select('*').from('users')
    if (!user) return res.redirect('/')
    fetch(`https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${user.refreshtoken}&client_id=${TClientid}&client_secret=${TClientsecret}`, { method: 'POST' }).then(res => res.json()).then(async json => {
      await db.where({ id:req.user.id }).update({ accesstoken: json.access_token, refreshtoken: json.refresh_token }).select('*').from('users')
      req.oauth = json.access_token
      next()
    })
  } else res.redirect('/')
}

module.exports = tokenMiddleware

