var dns = require('./dns')
  , containers = require('./containers')
  , QTYPE_TO_NAME = require('native-dns').consts.QTYPE_TO_NAME

console.log('Starting servers...');
dns.listen(5000).then(() => console.log('[DNS] Server started on port 5000'))

dns.server.on('answer', (answer) => {
  answer.forEach((a) => {
    var type = QTYPE_TO_NAME[a.type]
    console.log(`[DNS] ${type} IN ${a.name} --> ${a.address}`)
  })
})

var stream = containers.stream()
stream.on('connected', () => console.log('[Docker] Connected!'))
stream.on('error', (err) => {
  console.log('[Docker] Error in docker communication')
  throw err
})
stream.on('add', (c) => console.log(`[Docker] Container added: ${c.name}`))
stream.on('remove', (c) => console.log(`[Docker] Container removed: ${c.name}`))
stream.on('refresh', (containers) => {
  var running = containers.map((c) => c.name)
  console.log(`[Docker] Refreshed container list: ${running.join(',')}`)
})
