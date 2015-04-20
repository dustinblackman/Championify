cheerio = require 'cheerio'
async = require 'async'
colors = require 'colors'
moment = require 'moment'
fs = require 'fs'
prompt = require 'prompt'
glob = require 'glob'
mkdirp = require 'mkdirp'
exec = require('child_process').exec
open = require 'open'

hlp = require './helpers'
pkg = require './package.json'

# Mini JSON files to keep track of CSS paths and a default object for Builds.
defaultSchema = require './data/default.json'
csspaths = require './data/csspaths.json'
prebuilts = require './data/prebuilts.json'
manaless = require './data/manaless.json'

# Set Defaults
GLOBAL.champData = {}
GLOBAL.riotVer = '5.7'  # This will change
GLOBAL.lolInstallPath = null


#################
#    HELPERS
#################

# Pretty Console Log
cl = (text, color) ->
  color = color or 'white'

  m = moment().format('HH:mm:ss')
  m = ('['+m+']').bold.cyan + " | "
  if process.platform == 'darwin' and color == 'white'  # GG crappy OSX default white terminal.
    m = m + text
  else
    m = m + (text).bold[color]

  console.log(m)


# Called when something has gone wrong.
# Gives the user a chance to read the output before closing the window.
enterToExit = ->
  cl 'Press enter to close.', 'yellow'
  prompt.start()
  prompt.get ['enter'], ->
    process.exit(1)


#################
#      MAIN
#################

# We check if were running on a Windows system.
# If so, check for admin. If no admin, warn and close.
isWindowsAdmin = (cb) ->
  if process.platform != 'darwin'
    exec 'NET SESSION', (err, std, ste) ->
      if ste.length != 0
        cl 'Whoops! You need to run me as an admin. Right click on my file and hit "Run as Administrator"', 'yellow'
        enterToExit()
      else
        cb null

  else
    cb null


# Check if this is the latest version of the application. Otherwise prompt to download new.
checkVer = (cb) ->
  host = 'raw.githubusercontent.com'
  url = '/dustinblackman/Championify/master/package.json'
  hlp.httpsRequest host, url, (data) ->
    data = JSON.parse(data)
    if data.version != pkg.version
      cl 'This seems to be an old version, let me open the download page for you to get an update!', 'yellow'
      open('https://github.com/dustinblackman/Championify/releases')
      enterToExit()
    else
      cl 'Your version of Championify is up to date!', 'green'
      cb null


# Get the install path of League of Legends
# On OSX, we check if League is installed in /Applications.
# If not we ask the user to drag their League Of Legends.app in to the terminal window and take it from there.

# On Windows, we check if the application is being run next to lol.launcher.exe.
# If it isn't, we check the default install path (C:/Riot Games).
# And if not that, we ask the user to run the application again from within the install directory.
getInstallPath = (cb) ->
  if process.platform == 'darwin'
    if fs.existsSync('/Applications/League of Legends.app')
      GLOBAL.lolInstallPath = '/Applications/League of Legends.app/Contents/LoL/Config/Champions/'
      cb null

    else
      cl 'Please drag your League Of Legends.app in to this window and hit enter!'
      prompt.start()
      prompt.get ['lol'], (err, results) ->
        path = results.lol
        path = path.trim()
        path = path.replace(/\\/g, '')
        GLOBAL.lolInstallPath = path + '/Contents/LoL/Config/Champions/'

        if fs.existsSync(GLOBAL.lolInstallPath)
          cb null
        else
          cl "Whoops, that doesn't seem to be the League of Legends.app. Restart me and try again.", 'yellow'
          enterToExit()

  else
    if fs.existsSync(process.cwd() + '/lol.launcher.exe')
      GLOBAL.lolInstallPath = process.cwd() + '/Config/Champions/'
      cb null

    else if fs.existsSync('C:/Riot Games/League Of Legends/lol.launcher.exe')
      GLOBAL.lolInstallPath = 'C:/Riot Games/League Of Legends/Config/Champions/'
      cb null

    else
      cl "Whoops, I can't seem to find your League folder! Copy me in to your League folder and run me again.", 'yellow'
      enterToExit()


# Console log what install path were using after getInstallPath closes.
clInstallPath = (cb) ->
  cl 'Using League Installation in: ' +GLOBAL.lolInstallPath, 'green'
  cb null


# Get latest Riot Version
getRiotVer = (cb) ->
  cl '--Getting Latest LoL Version Number'
  hlp.httpRequest 'ddragon.leagueoflegends.com', '/api/versions.json', (body) ->
    data = JSON.parse(body)
    GLOBAL.riotVer = data[0]
    cb null


# Download all the champs from riot (saves making requests to ChampionGG)
getChamps = (cb) ->
  cl '--Downloading Champs from Riot'
  hlp.httpRequest 'ddragon.leagueoflegends.com', '/cdn/'+GLOBAL.riotVer+'/data/en_US/champion.json', (body) ->
    champs = Object.keys(JSON.parse(body).data)
    cb null, champs


# This executes the scraper for ChampionGG
# We scrape ChampionGG 5 at a time, this prevents high load on ChampionGGs side, as we don't want to cause issues
# their servers.
processChamps = (champs, cb) ->
  async.eachLimit champs, 5, (champ, acb) ->
    requestPage {champ: champ}, () ->
      acb null
  , () ->
    cb null


# Delete all the previous ChampionGG builds.
deleteOldBuilds = (cb) ->
  cl '--Deleting Old Builds'
  glob GLOBAL.lolInstallPath+'**/CGG_*.json', (err, files) ->
    async.each files, (item, ecb) ->
      fs.unlink item, (err) ->
        console.log err if err
        ecb null
    , () ->
      cb null


# Save all builds we created to file in the correct directory.
saveToFile = (cb) ->
  cl '--Saving Builds to File'
  async.each Object.keys(GLOBAL.champData), (champ, acb) ->
    async.each Object.keys(GLOBAL.champData[champ]), (position, pcb) ->
      toFileData = JSON.stringify(GLOBAL.champData[champ][position], null, 4)

      mkdirp GLOBAL.lolInstallPath+champ+'/Recommended/', (err) ->
        fileName = GLOBAL.lolInstallPath+champ+'/Recommended/CGG_'+champ+'_'+position+'.json'
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
  url = '/champion/'+champ

  if obj.position
    url = url + '/' + obj.position
  else
    cl 'Processing: '+obj.champ

  hlp.httpRequest 'champion.gg', url, (body) ->
    $ = cheerio.load(body)

    # Using CSS Selectors, grab each piece of information we need from the page
    freqCore = hlp.getItems($, csspaths.freqCore.build)
    freqCoreWins = $(csspaths.freqCore.wins).text()
    freqCoreGames = $(csspaths.freqCore.games).text()

    freqStart = hlp.getItems($, csspaths.freqStart.build)
    freqStartWins = $(csspaths.freqStart.wins).text()
    freqStartGames = $(csspaths.freqStart.games).text()

    highestCore = hlp.getItems($, csspaths.highestCore.build)
    highestCoreWins = $(csspaths.highestCore.wins).text()
    highestCoreGames = $(csspaths.highestCore.games).text()

    highestStart = hlp.getItems($, csspaths.highestStart.build)
    highestStartWins = $(csspaths.highestStart.wins).text()
    highestStartGames = $(csspaths.highestStart.games).text()

    # Check what role were currently grabbing, and what other roles exist.
    positions = []
    currentPosition = ''

    $(csspaths.positions).find('a').each (i, e) ->
      position = $(e).attr('href').split('/')
      position = position[position.length - 1]
      if $(e).parent().hasClass('selected-role')
        currentPosition = position
      else
        positions.push position

    # Create Builds (Blocks)
    builds = []
    builds.push {
      items: hlp.arrayToBuilds(freqStart).concat(prebuilts.trinkets)
      type: 'Most Frequent Starters ('+freqStartWins+' wins - '+freqStartGames+ ' games)'
    }
    builds.push {
      items: hlp.arrayToBuilds(highestStart).concat(prebuilts.trinkets)
      type: 'Highest Win % Starters ('+highestStartWins+' wins - '+highestStartGames+ ' games)'
    }
    builds.push {
      items: hlp.arrayToBuilds(freqCore)
      type: 'Most Frequent Core Build ('+freqCoreWins+' wins - '+freqCoreGames+ ' games)'
    }
    builds.push {
      items: hlp.arrayToBuilds(highestCore)
      type: 'Highest Win % Core Build ('+highestCoreWins+' wins - '+highestCoreGames+ ' games)'
    }

    # If champ has no mana, remove mana pot from consumables
    consumables = prebuilts.consumables.concat([])  # Lazy fix for pointer issue.
    if manaless.indexOf(champ) > -1
      consumables.splice(1, 1)

    builds.push {
      items: consumables
      type: "Consumables"
    }
    builds.push {
      items: prebuilts.trinketUpgrades
      type: "Trinket Upgrades"
    }

    # Save data to Global object for saving to disk later.
    # We do this incase people cancel the function half way though.
    if !GLOBAL.champData[champ]
      GLOBAL.champData[champ] = {}

    newObj = {
      champion: champ,
      title: currentPosition+' '+GLOBAL.riotVer,
      blocks: builds
    }

    GLOBAL.champData[champ][currentPosition] = hlp.mergeObj(defaultSchema, newObj)

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


async.waterfall [
  isWindowsAdmin
  checkVer
  getInstallPath
  clInstallPath
  getRiotVer
  getChamps
  processChamps
  deleteOldBuilds
  saveToFile
], () ->
  cl 'Looks like were all done. Login and enjoy!', 'green'
  prompt.start()
  prompt.get ['enter'], () ->
    process.exit(0)
