cheerio = require 'cheerio'
async = require 'async'
_ = require 'lodash'

hlp = require './helpers.coffee'

# Mini JSON files to keep track of CSS paths, schemas, default builds, and manaless champs.
defaultSchema = require '../data/default.json'
csspaths = require '../data/csspaths.json'
prebuilts = require '../data/prebuilts.json'
manaless = require '../data/manaless.json'

cl = hlp.cl

# Set Defaults
champData = {}


###*
 * Function Async execute scraper on Champion.gg. Currently at 2 at a time to prevent high load.
 * @param {Array} Array of strings of Champs from Riot.
 * @callback {Function} Callback.
###
requestChamps = (step, r) ->
  async.eachLimit r.champs, 2, (champ, next) ->
    hlp.updateProgressBar(90 / r.champs.length)
    requestPage {champ: champ}, () ->
      next null

  , () ->
    step null


###*
 * Function Request champion.gg page, 3 retries (according to Helpers).
 * @param {Object} Champion object created by asyncRequestChamps.
 * @callback {Function} Callback.
###
requestPage = (champ_info, step) ->
  champ = champ_info.champ
  url = 'http://champion.gg/champion/'+champ

  if champ_info.position
    url = url + '/' + champ_info.position
  else
    cl 'Processing Rift: '+champ_info.champ

  hlp.ajaxRequest url, (err, body) ->
    window.log.warn(err) if err
    if err or _.contains(body, 'We\'re currently in the process of generating stats for')
      GLOBAL.undefinedBuilds.push(champ)
      return step()

    processChamp(champ_info, body, step)


###*
 * Function Process scraped Champion.GG page.
 * @param {Object} Champion object created by asyncRequestChamps.
 * @param {String} Body of Champion.GG page.
 * @callback {Function} Callback.
###
processChamp = (champ_info, body, step) ->
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

  if _.contains(undefArray, true)
    GLOBAL.undefinedBuilds.push(champ + ' ' + _.capitalize(currentPosition))
    return step()

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
      if _.contains(manaless, champ)
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
    if _.eq(freqStart.build, highestStart.build)
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
    if _.eq(freqCore.build, highestCore.build)
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

    # Lock item sets to Summoners Rift
    riot_json = _.merge(_.clone(defaultSchema, true), newObj)
    if window.cSettings.locksr
      riot_json.map = 'SR'

    champData[champ][positionForFile] = riot_json

  # Save data to Global object for saving to disk later.
  # We do this incase people cancel the function half way though.
  if !champData[champ]
    champData[champ] = {}


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

    async.each positions, (item, next) ->
      requestPage item, () ->
        next null

    , () -> step()

  else
    step()


###*
 * Function Save Rift item sets to file
 * @callback {Function} Callback.
###
saveToFile = (step) ->
  cl 'Saving Rift Item Sets'
  hlp.saveToFile champData, (err) ->
    return step(err) if err

    hlp.updateProgressBar(2.5)
    step null

###*
 * Export
###
module.exports = {
  requestChamps: requestChamps
  save: saveToFile
}
