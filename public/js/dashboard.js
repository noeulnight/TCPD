function convertFileToDataURLviaFileReader(url, callback) {
  var xhr = new XMLHttpRequest()
  xhr.onload = function() {
    var reader = new FileReader()
    reader.onloadend = function() {
      callback(reader.result)
    }
    reader.readAsDataURL(xhr.response)
  };
  xhr.open('GET', url)
  xhr.responseType = 'blob'
  xhr.send()
}

$('#img2b64').submit(function(event) {
  var convertFunction = convertFileToDataURLviaFileReader

  convertFunction(imageUrl, function(base64Img) {
    console.log(base64Img)
  })

  event.preventDefault()
})