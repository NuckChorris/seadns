var Docker = require('dockerode')
var docker = new Docker
var splitStream = require('split')

var REFRESH_INTERVAL = 15 * 60 * 1000 // 15 minutes

var containers = module.exports = {
  /**
   * byId: {
   *   '46f774729421fb48ccd37316028a2f16b4ef972ac23c7f10011551191bf38061': {
   *     ip: '127.0.0.1',
   *     names: ['tender_hopper']
   *   },
   * }
   */
  byId: {},

  /**
   * nameToId: {
   *   'tender_hopper': '46f774729421fb48ccd37316028a2f16b4ef972ac23c7f10011551191bf38061'
   * }
   */
  nameToId: {},

  /**
   * Add a list of containers to the cache
   */
  add: function add (list) {
    /* [{ip: '', id: '', names: ''}, ...] */
    list.forEach(function (c) {
      containers.byId[c.id] = c
      containers.nameToId[c.name] = c.id
    })
  },

  /**
   * Remove all cached containers
   */
  empty: function empty () {
    containers.byId = {}
    containers.nameToId = {}
  },

  /**
   * Remove a single cached container
   */
  remove: function remove (id) {
    var container = containers.byId[id]
    delete containers.nameToId[container.name]
    delete containers.byId[id]
  },

  /**
   * Find a container by name or id
   */
  find: function find(nameOrId) {
    var container = containers.byId[nameOrId]
    if (!container) nameOrId = containers.nameToId[nameOrId]
    return container || containers.byId[nameOrId]
  },

  /**
   * Refresh the container cache
   *
   * @returns Promise
   */
  refresh: function refresh () {
    return new Promise(function (resolve, reject) {
      docker.listContainers(function (err, list) {
        if (err) return reject(err)
        containers.empty()
        var cons = list.map((c) => containers.getContainer(c.Id))
        Promise.all(cons).then((list) => {
          containers.add(list)
          resolve(list)
        })
      })
    })
  },

  /**
   * Connect the streams and refresh system
   */
  stream: function stream () {
    var ee = new process.EventEmitter()

    // Full refresh every so often
    function freshen () {
      containers.refresh().then(
        (con) => ee.emit('refresh', con),
        (err) => ee.emit('error', err)
      )
    }
    freshen()
    setInterval(freshen, REFRESH_INTERVAL)

    // Stream updates in
    docker.getEvents({}, function (err, stream) {
      if (err) return ee.emit('error', err)

      ee.emit('connected')
      var eventStream = stream.pipe(splitStream(JSON.parse))
      eventStream.on('data', function (event) {
        if (event.Type !== 'container') return;

        if (event.Action === 'start') {
          var con = {id: event.Actor.ID, name: event.Actor.Attributes.name}
          ee.emit('add', con)
          containers.add([con])
          containers.getContainer(event.Actor.ID).then(
            (con) => { containers.add(res) },
            (err) => { ee.emit('error', err) }
          )
        } else if (event.Action === 'stop' || event.Action === 'die') {
          ee.emit('remove', Object.create(containers.byId[event.Actor.ID]))
          containers.remove(event.Actor.ID)
        }
      })
    })
    return ee
  },

  /**
   * Get container info by docker id
   */
  getContainer: function getContainer (id) {
    return new Promise(function (resolve, reject) {
      var container = docker.getContainer(id)
      container.inspect(function (err, data) {
        if (err) return reject(err);
        resolve({
          id: data.Id,
          name: data.Name.replace(/^\//, ''),
          ip: data.NetworkSettings.IPAddress
        });
      })
    })
  },
}
