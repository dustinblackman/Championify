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


# Gives the user a chance to read the output before closing the window.
enterToExit = ->
  cl 'Press enter to close.', 'yellow'
  # prompt.start()
  # prompt.get ['enter'], ->
  #   process.exit(1)


#################
#      MAIN
#################


# Check if this is the latest version of the application. Otherwise prompt to download new.
checkVer = (cb) ->
  url = 'https://raw.githubusercontent.com/dustinblackman/Championify/master/package.json'
  hlp.httpRequest url, (data) ->
    data = JSON.parse(data)
    if data.version != pkg.version
      cl 'This seems to be an old version, your version is '+pkg.version+' while the latest is '+data.version+'.'
      cl 'Let me open the download page for you to get an update!'
      cl "If a new window doesn't open for you, get the latest here."
      cl "https://github.com/dustinblackman/Championify/releases/latest"
      open('https://github.com/dustinblackman/Championify/releases/latest')
      enterToExit()
    else
      cl 'Your version of Championify is up to date!'
      cb null


# Get latest Riot Version
getRiotVer = (cb) ->
  cl 'Getting Latest LoL Version Number'
  hlp.httpRequest 'http://ddragon.leagueoflegends.com/api/versions.json', (body) ->
    window.riotVer = body[0]
    cb null


# Download all the champs from riot (saves making requests to ChampionGG)
getChamps = (cb) ->
  cl 'Downloading Champs from Riot'
  hlp.httpRequest 'http://ddragon.leagueoflegends.com/cdn/'+window.riotVer+'/data/en_US/champion.json', (body) ->
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
    console.log(window.champData)
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

  hlp.httpRequest url, (body) ->
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

    # Create Builds (Blocks)
    builds = []

    build_freqStart = hlp.arrayToBuilds(freqStart).concat(prebuilts.trinkets)
    build_highestStart = hlp.arrayToBuilds(highestStart).concat(prebuilts.trinkets)
    build_freqCore = hlp.arrayToBuilds(freqCore)
    build_highestCore = hlp.arrayToBuilds(highestCore)

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

    # Trinkets
    builds.push {
      items: prebuilts.trinketUpgrades
      type: 'Trinkets | Frequent: '+skillsMostFreq
    }

    # If champ has no mana, remove mana pot from consumables
    consumables = prebuilts.consumables.concat([])  # Lazy fix for pointer issue.
    if manaless.indexOf(champ) > -1
      consumables.splice(1, 1)

    builds.push {
      items: consumables
      type: 'Consumables | Wins: '+skillsHighestWin
    }

    # Save data to Global object for saving to disk later.
    # We do this incase people cancel the function half way though.
    if !window.champData[champ]
      window.champData[champ] = {}

    newObj = {
      champion: champ,
      title: currentPosition+' '+window.riotVer,
      blocks: builds
    }

    window.champData[champ][currentPosition] = hlp.mergeObj(defaultSchema, newObj)

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
  checkVersion: checkVer
  setVersion: setVersion
}
