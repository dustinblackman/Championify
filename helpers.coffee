http = require 'http'
https = require 'https'

module.exports = {
  # Merge two objects
  mergeObj: (obj1, obj2) ->
    obj3 = {}
    for attrname of obj1
      obj3[attrname] = obj1[attrname]
    for attrname of obj2
      obj3[attrname] = obj2[attrname]
    obj3


  # Usually I'd use the request module, but it and browserify don't get along.
  # This was a nice and easy alternative that did what I wanted.
  httpRequest: (host, url, cb) ->
    http.get {
      host: host
      path: url
    }, (response) ->
      body = ''

      response.on 'error', (err) ->
        console.log err

      response.on 'data', (d) ->
        body += d

      response.on 'end', ->
        cb body

  httpsRequest: (host, url, cb) ->
    https.get {
      host: host
      path: url
      port: 443
      headers: {
        'accept': '*/*'
      }
    }, (response) ->
      body = ''

      response.on 'error', (err) ->
        console.log err

      response.on 'data', (d) ->
        body += d

      response.on 'end', ->
        cb body

  # Converts the arrays from Cheerio output to LoL Blocks
  # Kinda lazy, but works like a charm.
  arrayToBuilds: (arr) ->
    build = []

    obj = arr.reduce (acc, curr) ->
      if typeof acc[curr] == 'undefined'
        acc[curr] = 1
      else
        acc[curr] += 1
      return acc
    , {}

    arr = arr.filter (v, i, a) ->
      a.indexOf(v) == i

    arr.forEach (e) ->
      count = obj[e]
      if e == '2010'  # Nugget biscuit nugget in a biscuit.
        e = '2003'
      build.push {id: e, count: count}

    return build

  # Processes the build images to grab each ID
  getItems: ($, selector) ->
    c = $(selector).find('img').map (i, e) ->
      item = $(e).attr('src').split('/')
      item = item[item.length - 1].split('.')[0]
      return item

    return c.get()

}
