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
    $.ajax(url)
      .fail (err) ->
        console.log err
      .done (body) ->
        cb body


  downloadFile: (url, dest, cb) ->
    file = fs.createWriteStream(dest)
    https.get url, (res) ->
      res.pipe file
      file.on 'finish', ->
        file.close cb


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
  getItems: (cheer, selector) ->
    c = cheer(selector).find('img').map (i, e) ->
      item = cheer(e).attr('src').split('/')
      item = item[item.length - 1].split('.')[0]
      return item

    return c.get()

  # Process the skills table and return an array in order.
  getSkills: (cheer, selector) ->
    keys = ['Q', 'W', 'E', 'R']
    skillOrder = []

    data = cheer(selector).find('.skill')

    data.get().forEach (e, idx) ->
      if idx != 0
        cheer(e).find('.skill-selections').children().get().forEach (s, s_idx) ->
          if cheer(s).hasClass('selected')
            skillOrder[s_idx] = keys[idx-1]

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
