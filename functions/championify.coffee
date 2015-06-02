cheerio = require 'cheerio'
async = require 'async'
_ = require 'lodash'

hlp = require './helpers.coffee'
pkg = require '../package.json'
csspaths = require '../data/csspaths.json'

summonersRift = require './summoners_rift.coffee'
cl = hlp.cl

# Set Defaults
window.cSettings = {}


#################
#      MAIN
#################


###*
 * Function Check version of Github package.json and local.
 * @callback {Function} Callback.
###
checkVer = (step) ->
  url = 'https://raw.githubusercontent.com/dustinblackman/Championify/master/package.json'
  hlp.ajaxRequest url, (err, data) ->
    data = JSON.parse(data)
    if hlp.versionCompare(data.version, pkg.version) == 1
      step true, data.version
    else
      step false

###*
 * Function Collects options from the Frontend.
 * @callback {Function} Callback.
###
getSettings = (step) ->
  window.cSettings = {
    splititems: $('#options_splititems').is(':checked')
    skillsformat: $('#options_skillsformat').is(':checked')
    trinkets: $('#options_trinkets').is(':checked')
    consumables: $('#options_consumables').is(':checked')
    locksr: $('#options_locksr').is(':checked')
  }
  step null


###*
 * Function Gets the latest Riot Version.
 * @callback {Function} Callback.
###
getRiotVer = (step) ->
  cl 'Getting LoL Version'
  hlp.ajaxRequest 'http://ddragon.leagueoflegends.com/api/versions.json', (err, body) ->
    hlp.updateProgressBar(1.5)
    step null, body[0]


###*
  * Function Gets current version Champion.GG is using.
  * @callback {Function} Callback.
###
getChampionGGVer = (step) ->
  cl 'Getting Champion.GG Version'
  hlp.ajaxRequest 'http://champion.gg/faq/', (err, body) ->
    $c = cheerio.load(body)
    window.champGGVer = $c(csspaths.version).text()
    hlp.updateProgressBar(1.5)
    step null


###*
 * Function Downloads all available champs from Riot.
 * @callback {Function} Callback.
###
getChamps = (step, r) ->
  cl 'Downloading Champs from Riot'
  hlp.ajaxRequest 'http://ddragon.leagueoflegends.com/cdn/'+r.riotVer+'/data/en_US/champion.json', (err, body) ->
    step null, Object.keys(body.data)


# TODO: This doesn't work on Windows if the files were created with admin priveleges but are trying to delete without.
###*
 * Function Deletes all previous Championify builds from client.
 * @callback {Function} Callback.
###
deleteOldBuilds = (step, deletebtn) ->
  cl 'Deleting Old Builds'
  glob window.lolChampPath+'**/CGG_*.json', (err, files) ->
    async.each files, (item, next) ->
      fs.unlink item, (err) ->
        console.log err if err
        next null
    , () ->
      hlp.updateProgressBar(2.5) if !deletebtn
      step null


# TODO: This is a messy function. Clean it up with Lodash, possibly.
###*
 * Function Saves all compiled item sets to file, creating paths included.
 * @callback {Function} Callback.
###
saveToFile = (step) ->
  cl 'Saving Builds to File'
  async.each Object.keys(window.champData), (champ, next) ->
    async.each Object.keys(window.champData[champ]), (position, nextPosition) ->
      toFileData = JSON.stringify(window.champData[champ][position], null, 4)

      mkdirp window.lolChampPath+champ+'/Recommended/', (err) ->
        fileName = window.lolChampPath+champ+'/Recommended/CGG_'+champ+'_'+position+'.json'
        fs.writeFile fileName, toFileData, (err) ->
          console.log err if err
          nextPosition null

    , () ->
      next null

  , () ->
    hlp.updateProgressBar(2.5)
    step null


###*
 * Function To output any champ/positions that were done due to timeouts or undefined builds.
 * @callback {Function} Callback.
###
notProcessed = (step) ->
  _.each window.undefinedBuilds, (e) ->
    cl 'Not Available: '+e

  step()


###*
 * Function Main function that starts up all the magic.
 * @callback {Function} Callback.
###
downloadItemSets = (done) ->
  async.auto {
    # Default
    settings: getSettings
    champGGVer: getChampionGGVer
    riotVer: getRiotVer
    champs:  ['riotVer', getChamps]

    # Summoners Rift
    srItemSets: ['champs', 'champGGVer', summonersRift]

    # End/Save
    deleteOldBuilds: ['srItemSets', deleteOldBuilds]
    saveToFile: ['deleteOldBuilds', saveToFile],
    notProcessed: ['saveToFile', notProcessed]
  }, (err, r) ->
    console.log(err) if err
    hlp.updateProgressBar(10) # Just max it.
    cl 'Looks like were all done. Login and enjoy!'
    done()


###*
 * Export.
###
window.Championify = {
  run: downloadItemSets
  checkVer: checkVer
  delete: deleteOldBuilds
}
