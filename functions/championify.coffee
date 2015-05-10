cheerio = require 'cheerio'
async = require 'async'
moment = require 'moment'

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


#################
#    HELPERS
#################

# Pretty Console Log
cl = (text) ->
  m = moment().format('HH:mm:ss')
  m = ('['+m+'] | ') + text
  console.log(m)
  $('#progress').prepend('<span>'+text+'</span><br />')


# Sets version on interface. Have it here cause I need access to package.json, should be in browser, but whatever.
setVersion = ->
  $('.version > span').text('v'+pkg.version)


#################
#      MAIN
#################

# Check if this is the latest version of the application.
checkVer = (cb) ->
  url = 'https://raw.githubusercontent.com/dustinblackman/Championify/master/package.json'
  hlp.ajaxRequest url, (data) ->
    data = JSON.parse(data)
    # data.version = '100'  # TODO REMOVE
    if data.version != pkg.version
      cb true, data.version
    else
      cb false


updateVer = (version, cb) ->
  dirName = window.Championify.browser.dirName
  url = 'http://localhost:8080/update.asar'
  dest = dirName.replace(/app.asar/g, '') + 'update-asar'

  console.log url
  console.log dest
  console.log dirName

  hlp.downloadFile url, dest, ->
    fs.unlink dirName, () ->
      fs.rename dest, dirName, () ->
        cb()



getSettings = (cb) ->
  window.cSettings = {
    splititems: $('#options_splititems').is(':checked')
    skillsformat: $('#options_skillsformat').is(':checked')
    trinkets: $('#options_trinkets').is(':checked')
    consumables: $('#options_consumables').is(':checked')
  }
  cb null


# Get latest Riot Version
getRiotVer = (cb) ->
  cl 'Getting Latest LoL Version Number'
  hlp.ajaxRequest 'http://ddragon.leagueoflegends.com/api/versions.json', (body) ->
    window.riotVer = body[0]
    cb null


# Download all the champs from riot (saves making requests to ChampionGG)
getChamps = (cb) ->
  cl 'Downloading Champs from Riot'
  hlp.ajaxRequest 'http://ddragon.leagueoflegends.com/cdn/'+window.riotVer+'/data/en_US/champion.json', (body) ->
    champs = Object.keys(body.data)
    cb null, champs

# This executes the scraper for ChampionGG
# We scrape ChampionGG 5 at a time, this prevents high load on ChampionGGs side, as we don't want to cause issues
# with their servers.
processChamps = (champs, cb) ->
  async.eachLimit champs, 5, (champ, acb) ->
    requestPage {champ: champ}, () ->
      acb null
  , () ->
    cb null


# Delete all the previous ChampionGG builds.
deleteOldBuilds = (cb) ->
  cl 'Deleting Old Builds'
  glob window.lolChampPath+'**/CGG_*.json', (err, files) ->
    async.each files, (item, ecb) ->
      fs.unlink item, (err) ->
        console.log err if err
        ecb null
    , () ->
      cb null


# Save all builds we created to file in the correct directories.
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
    cb null


# Makes request to Champion.gg
requestPage = (obj, cb) ->
  champ = obj.champ
  url = 'http://champion.gg/champion/'+champ

  if obj.position
    url = url + '/' + obj.position
  else
    cl 'Processing: '+obj.champ

  hlp.ajaxRequest url, (body) ->
    cheer = cheerio.load(body)

    # Using CSS Selectors, grab each piece of information we need from the page
    freqCore = hlp.getItems(cheer, csspaths.freqCore.build)
    freqCoreWins = cheer(csspaths.freqCore.wins).text()
    freqCoreGames = cheer(csspaths.freqCore.games).text()

    freqStart = hlp.getItems(cheer, csspaths.freqStart.build)
    freqStartWins = cheer(csspaths.freqStart.wins).text()
    freqStartGames = cheer(csspaths.freqStart.games).text()

    highestCore = hlp.getItems(cheer, csspaths.highestCore.build)
    highestCoreWins = cheer(csspaths.highestCore.wins).text()
    highestCoreGames = cheer(csspaths.highestCore.games).text()

    highestStart = hlp.getItems(cheer, csspaths.highestStart.build)
    highestStartWins = cheer(csspaths.highestStart.wins).text()
    highestStartGames = cheer(csspaths.highestStart.games).text()

    skillsMostFreq = hlp.getSkills(cheer, csspaths.skills.mostFreq)
    skillsHighestWin = hlp.getSkills(cheer, csspaths.skills.highestWin)

    # Check what role were currently grabbing, and what other roles exist.
    positions = []
    currentPosition = ''

    cheer(csspaths.positions).find('a').each (i, e) ->
      position = cheer(e).attr('href').split('/')
      position = position[position.length - 1]
      if cheer(e).parent().hasClass('selected-role')
        currentPosition = position
      else
        positions.push position

    build_freqStart = hlp.arrayToBuilds(freqStart).concat(prebuilts.trinkets)
    build_highestStart = hlp.arrayToBuilds(highestStart).concat(prebuilts.trinkets)
    build_freqCore = hlp.arrayToBuilds(freqCore)
    build_highestCore = hlp.arrayToBuilds(highestCore)


    # Reusable function for generating Trainkets and Consumables.
    trinksCon = (builds) ->
      # Trinkets
      if window.cSettings.trinkets
        builds.push {
          items: prebuilts.trinketUpgrades
          type: 'Trinkets | Frequent: '+skillsMostFreq
        }

      if window.cSettings.consumables
        # If champ has no mana, remove mana pot from consumables
        consumables = prebuilts.consumables.concat([])  # Lazy fix for pointer issue.
        if manaless.indexOf(champ) > -1
          consumables.splice(1, 1)

        builds.push {
          items: consumables
          type: 'Consumables | Wins: '+skillsHighestWin
        }

      return builds


    normalItemSets = () ->
      builds = []

      # If freqStart and highestStart are the same, only push once.
      if JSON.stringify(build_freqStart) == JSON.stringify(build_highestStart)
        builds.push {
          items: build_freqStart
          type: 'Frequent/Highest Start ('+freqStartWins+' wins - '+freqStartGames+ ' games)'
        }

      else
        builds.push {
          items: build_freqStart
          type: 'Most Frequent Starters ('+freqStartWins+' wins - '+freqStartGames+ ' games)'
        }
        builds.push {
          items: build_highestStart
          type: 'Highest Win % Starters ('+highestStartWins+' wins - '+highestStartGames+ ' games)'
        }

      # If freqCore and highestCore are the same, only push once.
      if JSON.stringify(build_freqCore) == JSON.stringify(build_highestCore)
        builds.push {
          items: build_freqCore
          type: 'Frequent/Highest Core ('+freqCoreWins+' wins - '+freqCoreGames+ ' games)'
        }

      else
        builds.push {
          items: build_freqCore
          type: 'Most Frequent Core Build ('+freqCoreWins+' wins - '+freqCoreGames+ ' games)'
        }
        builds.push {
          items: build_highestCore
          type: 'Highest Win % Core Build ('+highestCoreWins+' wins - '+highestCoreGames+ ' games)'
        }

      # Add trinkets and consumables, if enabled.
      builds = trinksCon(builds)

      return builds


    splitItemSets = () ->
      mfBuild = []
      hwBuild = []

      mfBuild.push {
        items: build_freqStart
        type: 'Most Frequent Starters ('+freqStartWins+' wins - '+freqStartGames+ ' games)'
      }
      mfBuild.push {
        items: build_freqCore
        type: 'Most Frequent Core Build ('+freqCoreWins+' wins - '+freqCoreGames+ ' games)'
      }

      hwBuild.push {
        items: build_highestStart
        type: 'Highest Win % Starters ('+highestStartWins+' wins - '+highestStartGames+ ' games)'
      }
      hwBuild.push {
        items: build_highestCore
        type: 'Highest Win % Core Build ('+highestCoreWins+' wins - '+highestCoreGames+ ' games)'
      }

      mfBuild = trinksCon(mfBuild)
      hwBuild = trinksCon(hwBuild)

      return [mfBuild, hwBuild]


    pushChampData = (champ, position, build) ->
      positionForFile = position.replace(/ /g, '_').toLowerCase()
      newObj = {
        champion: champ,
        title: position+' '+window.riotVer,
        blocks: build
      }

      window.champData[champ][positionForFile] = hlp.mergeObj(defaultSchema, newObj)


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

    # Now we execute for the other positions for the champs, if there are any.
    if !obj.position and positions.length > 0
      positions = positions.map (e) ->
        return {champ: champ, position: e}

      async.each positions, (item, ecb) ->
        requestPage item, () ->
          ecb null
      , () ->
        cb()

    else
      cb()


downloadItemSets = (cb) ->
  async.waterfall [
    getSettings
    getRiotVer
    getChamps
    processChamps
    deleteOldBuilds
    saveToFile
  ], (err) ->
    console.log(err) if err
    cl 'Looks like were all done. Login and enjoy!'
    cb()


window.Championify = {
  run: downloadItemSets
  checkVer: checkVer
  updateVer: updateVer
  setVersion: setVersion
}
