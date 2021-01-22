// https://www.google.com/speech-api/v1/synthesize?text=9100원을 받은 줄 알았는데, 알고보니 후원 테스트 중이었네요. Kappa Kappa&lang=ko-kr&speed=0.4

const s = io()
s.on('donation', (data) => {

})

let list = []

window.onload = () => {
  const channel = document.getElementById('user').innerText
  const point = document.getElementById('rewards').innerText
  const client = new tmi.Client({
    connection: { reconnect: true },
    channels: [ 'nunggom' ]
  })
  client.connect()
  client.on('message', (channel, tags, message, self) => {
    !message ? list.push({ name: tags['display-name'] }) : true
  })
  
  setInterval(() => {
    if (list.length === 0) return
    play = true
      document.getElementById("name").innerHTML = `<span>${list[0].name}</span>님이 <span>${list[0].type}</span>(을)를 사용했습니다.`
      document.getElementById("cracker").play()
      document.getElementById("tts").src = json.url
      $( 'div' ).fadeIn( 500 )
      setTimeout(() => {
        document.getElementById("tts").play()
      }, 1000)
      setTimeout(() => {
        remove()
      }, 5000)
  }, 100)
  
  function remove() {
    setTimeout(() => {
      if (!document.getElementById("tts").paused) return remove()
      $( 'div' ).fadeOut( 500 )
      list.shift()
      setTimeout(() => {
        play = 0
      }, 100)
    }, 10)
  }
}