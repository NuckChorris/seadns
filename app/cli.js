var program = require('commander')
var pkg = require('../package.json')

var description = `
SeaDNS is a lightweight service which makes using a development-environment TLD
extremely easy, on all platforms.  It does this by providing a DNS server and a
small reverse proxy server, which resolves domains using names of running docker
containers.  HTTP and HTTPS traffic are reverse-proxied to their containers.

Generally you want to run SeaDNS as a docker container itself, and then set your
host's /etc/resolv.conf or add an entry to /etc/resolvers/*. SeaDNS does not
depend on presence of the \`docker\` command in your PATH, and uses its own
implementation of the Docker protocol.
`

module.exports function commandLine (argv) {
  program
    .version(pkg.version)
    .description(description)

  program
    .command('serve')
    .description('Run a set of servers based on the options passed')
    .option('--proxy <protocols>', 'A comma-separated list of protocols to proxy (options: http, https, default: null)', (proxy) => proxy.split(','))
    .option('--recursive', 'Starts a dnsmasq instance to handle non-SeaDNS queries (default: false)', false)
    .option('--ip <address>', 'An IP address to return for all queries.  Only really useful with --proxy (default: null)', null)
    .option('--tld <tld>', 'The TLD to handle queries for (default: ".sea")', (tld) => tld.trim('.'), 'sea')
    .action(function () {
      require('./cli/serve.js')(program)
    })

  program
    .command('serve-dns')
    .description('Run a DNS server which responds to queries for the SeaDNS TLD')
    .option('--port <port>', 'The port to listen on (default: 53)', parseInt, 53)
    .action(function () {
      require('./cli/serve-dns.js')(program)
    })

  program
    .command('serve-http')
    .description('Run an HTTP reverse proxy which routes traffic based on docker containers')
    .action(function () {
      require('./cli/serve-http')(program)
    })

  program.parse(argv)

  /*
  server({
    ports: {
      dns: program.dnsPort,
      http: program.httpPort,
      https: program.httpsPort,
    },
    tld: program.tld,
  })*/
}
