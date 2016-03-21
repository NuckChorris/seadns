var dns = require('native-dns')
var containers = require('./containers')
var EventEmitter = process.EventEmitter

function isType(question, type) {
  return question.type === dns.consts.NAME_TO_QTYPE[type]
      || question.type === type
}

var ee = new EventEmitter()

function lookup (domain) {
  if (domain.indexOf('.sea') === domain.length - 4) {
    var ip = containers.find(domain.slice(0, -4)).ip
    if (ip) return dns.A({ address: ip, name: domain, ttl: 60 })
  }
}

function answer (questions) {
  return questions
    .filter((q) => isType(q, 'A'))
    .map((q) => q.name)
    .map((domain) => lookup(domain))
}

var server = exports.server = dns.createServer()

exports.listen = function listen (port, address) {
  server.serve(port, address)
  server.on('request', (req, res) => {
    res.answer = answer(req.question).filter((a) => !!a)
    server.emit('answer', res.answer)
    res.send()
  })

  return new Promise((resolve, reject) => {
    server.on('listening', resolve)
    server.on('socketError', (err) => reject(err))
  })
}
