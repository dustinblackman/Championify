cheerio = require 'cheerio'
async = require 'async'
moment = require 'moment'
_ = require 'lodash'

hlp = require './helpers.coffee'
pkg = require '../package.json'

# Mini JSON files to keep track of CSS paths, schemas, default builds, and manaless champs.
defaultSchema = require '../data/default.json'
csspaths = require '../data/csspaths.json'
prebuilts = require '../data/prebuilts.json'
manaless = require '../data/manaless.json'

# Set Defaults
window.champData = {}
window.cSettings = {}
window.riotVer = '5.7'  # This will change
window.champGGVer = '5.8' # This will change
window.undefinedBuilds = []
window.progressIncr = 0


#################
#    HELPERS
#################

###*
 * Function Pretty console log, as well as updates the progress div on interface
 * @param {String} Console Message.
###
cl = (text) ->
  m = moment().format('HH:mm:ss')
  m = ('['+m+'] | ') + text
  console.log(m)
  $('#cl-progress').prepend('<span>'+text+'</span><br />')


###*
 * Function Updates the progress bar on the interface.
 * @param {Number} Increment progress bar.
###
updateProgressBar = (incr) ->
  window.progressIncr += incr
  $('.progress-bar').attr('style', 'width: '+Math.floor(window.progressIncr)+'%')



#################
#      MAIN
#################


# TODO: I think we can access Electrons package.json instead directly in the browser, making this useless.
###*
 * Function Check version of Github package.json and local.
 * @callback {Function} Callback.
###
checkVer = (cb) ->
  url = 'https://raw.githubusercontent.com/dustinblackman/Championify/master/package.json'
  hlp.ajaxRequest url, (data) ->
    data = JSON.parse(data)
    if hlp.versionCompare(data.version, pkg.version) == 1
      cb true, data.version
    else
      cb false

###*
 * Function Collects options from the Frontend.
 * @callback {Function} Callback.
###
getSettings = (cb) ->
  window.cSettings = {
    splititems: $('#options_splititems').is(':checked')
    skillsformat: $('#options_skillsformat').is(':checked')
    trinkets: $('#options_trinkets').is(':checked')
    consumables: $('#options_consumables').is(':checked')
  }
  cb null


###*
 * Function Gets the latest Riot Version.
 * @callback {Function} Callback.
###
getRiotVer = (cb) ->
  cl 'Getting LoL Version'
  hlp.ajaxRequest 'http://ddragon.leagueoflegends.com/api/versions.json', (body) ->
    window.riotVer = body[0]
    updateProgressBar(1.5)
    cb null


###*
  * Function Gets current version Champion.GG is using.
  * @callback {Function} Callback.
###
getChampionGGVer = (cb) ->
  cl 'Getting Champion.GG Version'
  hlp.ajaxRequest 'http://champion.gg/faq/', (body) ->
    $c = cheerio.load(body)
    window.champGGVer = $c(csspaths.version).text()
    updateProgressBar(1.5)
    cb()


###*
 * Function Downloads all available champs from Riot.
 * @callback {Function} Callback.
###
getChamps = (cb) ->
  cl 'Downloading Champs from Riot'
  hlp.ajaxRequest 'http://ddragon.leagueoflegends.com/cdn/'+window.riotVer+'/data/en_US/champion.json', (body) ->
    champs = Object.keys(body.data)
    cb null, champs


# TODO: This doesn't work on Windows if the files were created with admin priveleges but are trying to delete without.
###*
 * Function Deletes all previous Championify builds from client.
 * @callback {Function} Callback.
###
deleteOldBuilds = (cb) ->
  cl 'Deleting Old Builds'
  glob window.lolChampPath+'**/CGG_*.json', (err, files) ->
    async.each files, (item, ecb) ->
      fs.unlink item, (err) ->
        console.log err if err
        ecb null
    , () ->
      updateProgressBar(2.5)
      cb null


# TODO: This is a messy function. Clean it up with Lodash, possibly.
###*
 * Function Saves all compiled item sets to file, creating paths included.
 * @callback {Function} Callback.
###
saveToFile = (cb) ->
  cl 'Saving Builds to File'
  async.each Object.keys(window.champData), (champ, acb) ->
    async.each Object.keys(window.champData[champ]), (position, pcb) ->
      toFileData = JSON.stringify(window.champData[champ][position], null, 4)

      mkdirp window.lolChampPath+champ+'/Recommended/', (err) ->
        fileName = window.lolChampPath+champ+'/Recommended/CGG_'+champ+'_'+position+'.json'
        fs.writeFile fileName, toFileData, (err) ->
          console.log err if err
          pcb null

    , () ->
      acb null

  , () ->
    updateProgressBar(2.5)
    cb null



###*
 * Function Async execute scraper on Champion.gg. Currently at 2 at a time to prevent high load.
 * @param {Array} Array of strings of Champs from Riot.
 * @callback {Function} Callback.
###
requestChamps = (champs, cb) ->
  async.eachLimit champs, 2, (champ, acb) ->
    updateProgressBar(90 / champs.length)
    requestPage {champ: champ}, () ->
      acb null

  , () ->
    cb null


###*
 * Function Request champion.gg page, 3 retries (according to Helpers).
 * @param {Object} Champion object created by asyncRequestChamps.
 * @callback {Function} Callback.
###
requestPage = (champ_info, cb) ->
  champ = champ_info.champ
  url = 'http://champion.gg/champion/'+champ

  if champ_info.position
    url = url + '/' + champ_info.position
  else
    cl 'Processing: '+champ_info.champ

  async.retry 3, (_cb) ->
    hlp.ajaxRequest url, (body) ->
      _cb null, body

  , (err, body) ->
    if err or _.contains(body, "We're currently in the process of generating stats for")
      window.undefinedBuilds.push(champ)
      return cb()
    processChamp(champ_info, body, cb)


###*
 * Function Process scraped Champion.GG page.
 * @param {Object} Champion object created by asyncRequestChamps.
 * @param {String} Body of Champion.GG page.
 * @callback {Function} Callback.
###
processChamp = (champ_info, body, cb) ->
  champ = champ_info.champ

  $c = cheerio.load(body)
  gg = hlp.compileGGData($c)


  # Check what role were currently grabbing, and what other roles exist.
  currentPosition = ''

  $c(csspaths.positions).find('a').each (i, e) ->
    position = $c(e).attr('href').split('/')
    position = position[position.length - 1]
    if $c(e).parent().hasClass('selected-role')
      currentPosition = position.toLowerCase()

  positions = _.map gg.champion.roles, (e) ->
    return e.title.toLowerCase()
  positions = _.filter positions, (e) ->
    return e != currentPosition


  # Check if these builds aren't defined yet (happens during new patch)
  undefArray = [
    !gg.championData.items.mostGames.winPercent
    !gg.championData.firstItems.mostGames.winPercent
    !gg.championData.items.highestWinPercent.winPercent
    !gg.championData.firstItems.highestWinPercent.winPercent
  ]

  if undefArray.indexOf(true) > -1
    window.undefinedBuilds.push(champ + ' ' + _.capitalize(currentPosition))
    return cb()

  # Build objects for each section of item sets.
  freqCore = {
    items: gg.championData.items.mostGames.items
    wins: hlp.wins(gg.championData.items.mostGames.winPercent)
    games: gg.championData.items.mostGames.games
  }

  freqStart = {
    items: gg.championData.firstItems.mostGames.items
    wins: hlp.wins(gg.championData.firstItems.mostGames.winPercent)
    games: gg.championData.firstItems.mostGames.games
  }

  highestCore = {
    items: gg.championData.items.highestWinPercent.items
    wins: hlp.wins(gg.championData.items.highestWinPercent.winPercent)
    games: gg.championData.items.highestWinPercent.games
  }

  highestStart = {
    items: gg.championData.firstItems.highestWinPercent.items
    wins: hlp.wins(gg.championData.firstItems.highestWinPercent.winPercent)
    games: gg.championData.firstItems.highestWinPercent.games
  }


  # Process the skills table and return an array in order.
  processSkills = (skills) ->
    keys = {
      '1': 'Q'
      '2': 'W'
      '3': 'E'
      '4': 'R'
    }

    skillOrder = _.map skills, (e) ->
      return keys[e]

    if window.cSettings.skillsformat
      sliced_skills = _.countBy(skillOrder.slice(0, 9), _.identity)
      delete sliced_skills['R']
      sliced_skills = _.invert(sliced_skills)

      keys = _.keys(sliced_skills)
      keys.sort()
      keys.reverse()

      mapped_skills = _.map keys, (key) ->
        return sliced_skills[key]

      formatted_skills = skillOrder.slice(0, 4).join('.') + ' - ' + mapped_skills.join('>')
    else
      formatted_skills = skillOrder.join('.')

    return formatted_skills

  # Build string for skill priorities. Logic done in Helpers.
  skills = {
    mostFreq: processSkills(gg.championData.skills.mostGames.order)
    highestWin: processSkills(gg.championData.skills.highestWinPercent.order)
  }


  # TODO: Make this better with Lodash.
  # Converts array of items from ChampionGG in to useable object from LoL Blocks.
  arrayToBuilds = (arr) ->
    build = []

    arr = _.map arr, (e) ->
      return e.id.toString()

    count_obj = arr.reduce (acc, curr) ->
      if typeof acc[curr] == 'undefined'
        acc[curr] = 1
      else
        acc[curr] += 1
      return acc
    , {}

    arr = arr.filter (v, i, a) ->
      a.indexOf(v) == i

    arr.forEach (e) ->
      count = count_obj[e]
      if e == '2010'  # Nugget biscuit nugget in a biscuit.
        e = '2003'
      build.push {id: e, count: count}

    return build

  # Convert ChampionGG data to Championify. Append trinkets to Starting sets.
  freqStart.build = arrayToBuilds(freqStart.items).concat(prebuilts.trinkets)
  highestStart.build = arrayToBuilds(highestStart.items).concat(prebuilts.trinkets)
  freqCore.build = arrayToBuilds(freqCore.items)
  highestCore.build = arrayToBuilds(highestCore.items)


  # Reusable function for generating Trainkets and Consumables.
  trinksCon = (builds) ->
    # Trinkets
    if window.cSettings.trinkets
      builds.push {
        items: prebuilts.trinketUpgrades
        type: 'Trinkets | Frequent: '+skills.mostFreq
      }

    if window.cSettings.consumables
      # If champ has no mana, remove mana pot from consumables
      consumables = prebuilts.consumables.concat([])  # Lazy fix for pointer issue.
      if manaless.indexOf(champ) > -1
        consumables.splice(1, 1)

      builds.push {
        items: consumables
        type: 'Consumables | Wins: '+skills.highestWin
      }

    return builds


  # Generates item set for Combinded sets (with both Most Frequent and Highest Wins on one page)
  templates = {
    combindedStart: _.template('Frequent/Highest Start (<%- wins %> wins - <%- games %> games)')
    combinedCore: _.template('Frequent/Highest Core (<%- wins %> wins - <%- games %> games)')
    freqStart: _.template('Most Frequent Starters (<%- wins %> wins - <%- games %> games)')
    freqCore: _.template('Most Frequent Core Build (<%- wins %> wins - <%- games %> games)')
    highestStart: _.template('Highest Win % Starters (<%- wins %> wins - <%- games %> games)')
    highestCore: _.template('Highest Win % Core Build (<%- wins %> wins - <%- games %> games)')
  }
  normalItemSets = () ->
    builds = []

    # If freqStart and highestStart are the same, only push once.
    if JSON.stringify(freqStart.build) == JSON.stringify(highestStart.build)
      builds.push {
        items: freqStart.build
        type: templates.combindedStart({wins: freqStart.wins, games: freqStart.games})
      }

    else
      builds.push {
        items: freqStart.build
        type: templates.freqStart({wins: freqStart.wins, games: freqStart.games})
      }
      builds.push {
        items: highestStart.build
        type: templates.highestStart({wins: highestStart.wins, games: highestStart.games})
      }

    # If freqCore and highestCore are the same, only push once.
    if JSON.stringify(freqCore.build) == JSON.stringify(highestCore.build)
      builds.push {
        items: freqCore.build
        type: templates.combinedCore({wins: freqCore.wins, games: freqCore.games})
      }

    else
      builds.push {
        items: freqCore.build
        type: templates.freqCore({wins: freqCore.wins, games: freqCore.games})
      }
      builds.push {
        items: highestCore.build
        type: templates.highestCore({wins: highestCore.wins, games: highestCore.games})
      }

    # Add trinkets and consumables, if enabled.
    builds = trinksCon(builds)
    return builds


  # Generates a split item sets for Most Frequent and Highest Wins.
  splitItemSets = () ->
    mfBuild = []
    hwBuild = []

    mfBuild.push {
      items: freqStart.build
      type: templates.freqStart({wins: freqStart.wins, games: freqStart.games})
    }
    mfBuild.push {
      items: freqCore.build
      type: templates.freqCore({wins: freqCore.wins, games: freqCore.games})
    }

    hwBuild.push {
      items: highestStart.build
      type: templates.highestStart({wins: highestStart.wins, games: highestStart.games})
    }
    hwBuild.push {
      items: highestCore.build
      type: templates.highestCore({wins: highestCore.wins, games: highestCore.games})
    }

    mfBuild = trinksCon(mfBuild)
    hwBuild = trinksCon(hwBuild)

    return [mfBuild, hwBuild]

  # Inserts new item sets in to a global object to be used when we get to saving files.
  pushChampData = (champ, position, build) ->
    positionForFile = position.replace(/ /g, '_')

    if _.includes(position, 'adc')
      title = position.toUpperCase()
    else
      title = _.capitalize(position)

    newObj = {
      champion: champ,
      title: title + ' ' + window.champGGVer,
      blocks: build
    }

    window.champData[champ][positionForFile] = _.merge({}, defaultSchema, newObj)

  # Save data to Global object for saving to disk later.
  # We do this incase people cancel the function half way though.
  if !window.champData[champ]
    window.champData[champ] = {}


  # If split item sets
  if window.cSettings.splititems
    builds = splitItemSets()
    mfBuild = builds[0]
    hwBuild = builds[1]

    pushChampData(champ, currentPosition+' MF', mfBuild)
    pushChampData(champ, currentPosition+' HW', hwBuild)

  # If normal item sets
  else
    builds = normalItemSets()
    pushChampData(champ, currentPosition, builds)

  # TODO: Lodash map.
  # Now we execute for the other positions for the champs, if there are any.

  if !champ_info.position and positions.length > 0
    positions = positions.map (e) ->
      return {champ: champ, position: e}

    async.each positions, (item, ecb) ->
      requestPage item, () ->
        ecb null

    , () -> cb()

  else
    cb()


###*
 * Function To output any champ/positions that were done due to timeouts or undefined builds.
 * @callback {Function} Callback.
###
notProcessed = (cb) ->
  _.each window.undefinedBuilds, (e) ->
    cl 'Not Available: '+e

  cb()


###*
 * Function Main function that starts up all the magic.
 * @callback {Function} Callback.
###
downloadItemSets = (cb) ->
  async.waterfall [
    getSettings
    getChampionGGVer
    getRiotVer
    getChamps
    requestChamps
    deleteOldBuilds
    saveToFile
    notProcessed
  ], (err) ->
    console.log(err) if err
    updateProgressBar(10) # Just max it.
    cl 'Looks like were all done. Login and enjoy!'
    cb()


###*
 * Export.
###
window.Championify = {
  run: downloadItemSets
  checkVer: checkVer
}
