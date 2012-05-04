module.exports = config = {
  "name" : "Hummingbird",

  "tracking_port" : 80,
  "dashboard_port" : 8080,

  "mongo_host" : "localhost",
  "mongo_port" : 27017,

  "udp_address" : "127.0.0.1",
  "udp_port" : 8000,

  "enable_dashboard" : true,

  "capistrano" : {
    "repository" :       "git://github.com/soeffing/tracking_pixel.git",
    "hummingbird_host" : "hummingbird.your-host.com"
  }
}

