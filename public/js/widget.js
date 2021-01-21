let play = false
let stop = false 
let list = []
const s = io() // 소켓 설정

s.on('donation', (data) => {

})

setInterval(() => {
  if ( play === true || stop === true || list.length === 0) return
  console.log('Play Donation.')
  play = true
  fetch('/donate/api/v1?text=' + encodeURI(msg) + '&type=' + list[0].chr).then(function(response) { return response.json() }).then(function(json) {
    document.getElementById('typecast').style.display = 'block'
    document.getElementById("name").innerHTML = `<span>${list[0].name}</span>님이 <span>${list[0].type}</span>(을)를 사용했습니다.`
    document.getElementById("text").innerText = msg
    document.getElementById("cracker").play()
    document.getElementById("tts").src = json.url
    list[0].chr === 'chr2' ? document.getElementById('typecast').style.display = 'block' : document.getElementById('typecast').style.display = 'none'
    $( 'div' ).fadeIn( 500 )
    setTimeout(() => {
      document.getElementById("tts").play()
    }, 1000)
    setTimeout(() => {
      remove()
    }, 5000)
  })
}, 100)

function remove() {
  setTimeout(() => {
    if (!document.getElementById("tts").paused) return remove()
    $( 'div' ).fadeOut( 500 )
    list.shift()
    setTimeout(() => {
      play = 0
    }, 100)
  }, 10);
}