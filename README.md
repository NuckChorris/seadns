# SeaDNS

SeaDNS is a lightweight service which makes using a development-environment TLD
extremely easy, on all platforms.  It does this by providing a DNS server which
resolves domains using the names of running docker containers.

Generally you want to run SeaDNS as a docker container itself, and then set your
/etc/resolv.conf or add an entry to /etc/resolvers/*.

## Getting Started

### On OSX (w/ docker-machine/boot2docker VM)

1. Pull the image: `docker pull seadns`
2. Start the server: `docker run -d seadns serve`
3. Set your DNS: `docker run seadns nameserver -f osx > /etc/resolvers/sea`


3. `echo "nameserver $(docker inspect -f "{{ .NetworkSettings.IPAddress }}.53" seadns)" > /etc/resolvers/sea`

### On Linux (w/ local docker) or Windows (w/ docker-machine/boot2docker VM)

The seadns:masq image provides a proxy to seadns

1. Pull the image: `docker pull seadns`
2. Start the server: `docker run -d seadns serve --recurse`
3. Set your nameserver to the output of `docker run seadns nameserver -f generic`


3. Set your nameserver to the output of `docker inspect -f "{{ .NetworkSettings.IPAddress }}:53" seadns`

### With a remote docker-machine
Follow Step 1 above for your platform, then use the following for step 2 & 3:

#### OSX

2. `docker run -d -p 53:53 seadns seadns`
3. `echo "nameserver $(docker-machine ip $DOCKER_MACHINE_NAME).$(docker port seadns 53 | grep -o ":[0-9]\+$" | cut -d: -f2)\n" > /etc/resolvers/sea`

#### Linux/Window

2. `docker run -d -p 53:53 seadns:masq seadns`
3. ``

## How it works

SeaDNS exposes three services which work in tandem: a DNS server for responding
to .sea queries and reverse proxy servers for HTTP and HTTPS which read the Host
header and route the request to a docker container based on that.
