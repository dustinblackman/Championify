_ = require 'lodash'

module.exports = {
  # Merge two objects
  mergeObj: (obj1, obj2) ->
    obj3 = {}
    for attrname of obj1
      obj3[attrname] = obj1[attrname]
    for attrname of obj2
      obj3[attrname] = obj2[attrname]
    obj3


  ajaxRequest: (url, cb) ->
    $.ajax({url: url, timeout: 20000})
      .fail (err) ->
        console.log err
      .done (body) ->
        cb body


  wins: (text) ->
    return text.toString() + '%'


  versionCompare: (left, right) ->
    if typeof left + typeof right != 'stringstring'
      return false

    a = left.split('.')
    b = right.split('.')
    i = 0
    len = Math.max(a.length, b.length)

    while i < len
      if a[i] and !b[i] and parseInt(a[i]) > 0 or parseInt(a[i]) > parseInt(b[i])
        return 1
      else if b[i] and !a[i] and parseInt(b[i]) > 0 or parseInt(a[i]) < parseInt(b[i])
        return -1
      i++

    return 0


  compileGGData: ($c) ->
    data = $c('script:contains("matchupData.")').text()
    data = data.replace(/;/g, '')

    processed = {}

    query = _.template('matchupData.<%= q %> = ')
    _.each data.split('\n'), (line) ->
      _.each ['championData', 'champion'], (field) ->
        search = query({q: field})

        if _.includes(line, search)
          line = line.replace(search, '')
          processed[field] = JSON.parse(line)

    return processed


  # Converts the arrays from ChampionGG data to LoL Blocks
  # Kinda lazy, but works like a charm.
  # TODO: Make this better with Lodash.
  arrayToBuilds: (arr) ->
    build = []

    arr = _.map arr, (e) ->
      return e.id.toString()

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


  # Process the skills table and return an array in order.
  processSkills: (skills) ->
    keys = {
      '1': 'Q'
      '2': 'W'
      '3': 'E'
      '4': 'R'
    }

    skillOrder = _.map skills, (e) ->
      return keys[e]

    if window.cSettings.skillsformat
      arr = _.countBy(skillOrder.slice(0, 9), _.identity)
      delete arr['R']
      arr = _.invert(arr)

      keys = _.keys(arr)
      keys.sort()
      keys.reverse()

      skillOrder = _.map keys, (key) ->
        return arr[key]

      skillOrder = skillOrder.join('>')
    else
      skillOrder = skillOrder.join('.')

    return skillOrder

}
