// https://www.google.com/speech-api/v1/synthesize?text=9100원을 받은 줄 알았는데, 알고보니 후원 테스트 중이었네요. Kappa Kappa&lang=ko-kr&speed=0.4
let play = false
const s = io()

let list = []
let already = []

window.onload = () => {
  const channel = document.getElementById('user').innerText
  const session = location.href.split('/')[location.href.split('/').length - 1]
  const client = new tmi.Client({
    connection: { reconnect: true },
    channels: [ 'nunggom' ]
  })
  client.connect()
  client.on('message', (channel, tags, message, self) => {
    if (!tags['custom-reward-id']) return
    s.emit('point', session, tags['custom-reward-id'])
    s.on(session, (point, uid) => {
      if (already.includes(uid)) return
      already.push(uid)
      !message ? list.push({ name: tags['display-name'], type: point, id:tags['custom-reward-id'], uid }) : list.push({ name: tags['display-name'], id:tags['custom-reward-id'],type: point, uid })
    })
  })
}

setInterval(() => {
  if (list.length === 0 || play) return
  play = true
  document.getElementById("name").innerHTML = `<span>${list[0].name}</span>님이 <span>${list[0].type}</span>(을)를 사용했습니다.`
  document.getElementById("image").src = `/img/${list[0].id}`
  document.getElementById("cracker").play()
  document.getElementById("tts").src = `https://www.google.com/speech-api/v1/synthesize?text=${list[0].name}님이 ${list[0].type}를 사용했습니다.&lang=ko-kr&speed=0.4`
  $( 'div' ).fadeIn( 500 )
  setTimeout(() => {
    console.log('ttsplay')
    document.getElementById("tts").play()
    remove()
  }, 1000)
}, 100)

function remove() {
  setTimeout(() => {
    if (!document.getElementById("tts").paused) return remove()
    $( 'div' ).fadeOut( 500 )
    already.shift()
    list.shift()
    setTimeout(() => {
      play = false
    }, 100)
  }, 10)
}