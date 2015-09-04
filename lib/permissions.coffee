async = require 'async'
exec = require('child_process').exec
glob = require 'glob'
fs = require 'fs-extra'
mkdirp = require 'mkdirp'
path = require 'path'
_ = require 'lodash'

optionsParser = require './options_parser'
preferences = require './preferences'

# Windows Specific Dependencies
if process.platform == 'win32'
  runas = require 'runas'


###*
 * Function If platform is Windows, check if we can write to the user selected directory, and restart as admin if not.
 * @callback {Function} Callback
###
championTest = (step) ->
  if process.platform == 'win32' and !optionsParser.runnedAsAdmin()
    async.auto {
      checkChampionFolder: (next) ->
        if !fs.existsSync(window.item_set_path)
          mkdirp window.item_set_path, (err) ->
            next(err)
        else
          next()

      createFolder: ['checkChampionFolder', (next) ->
        mkdirp path.join(window.item_set_path, 'testme'), (err) ->
          next(err)
      ]

      createFile: ['createFolder', (next) ->
        mkdirp path.join(window.item_set_path, 'testme/test.txt'), (err) ->
          next(err)
      ]

      deleteExistingFile: ['checkChampionFolder', (next) ->
        champ_files = glob.sync(path.join(window.item_set_path, '**/*.json'))
        if champ_files and champ_files[0]
          fs.remove champ_files[0], (err) ->
            next(err)
        else
          next()
      ]

      writeExisting: ['checkChampionFolder', (next) ->
        champ_files = glob.sync(path.join(window.item_set_path, '**/*.json'))
        if champ_files and champ_files[0]
          data = fs.readFileSync(champ_files[0], 'utf8')
          fs.writeFile champ_files[0], data, {encoding: 'utf8'}, (err) ->
            next(err)
        else
          next()
      ]

      cleanup: ['createFile', (next) ->
        fs.remove path.join(window.item_set_path, 'testme'), (err) ->
          next(err)
      ]
    }, (err) ->
      if err
        runas(process.execPath, ['--startAsAdmin', '--import'], {hide: false, admin: true})
      else
        step null

  else
    step null


###*
 * Function
 * @param {String} Root path
 * @param {Array} Files
 * @callback {Function} Callback
###
setWindowsPermissions = (files, next) ->
  cmds = _.map files, (f) ->
    return "ICACLS \"#{f}\" /grant Users:F"
  cmds.push('exit')

  permissions_file = path.join(preferences.directory(), 'set_permission.bat')
  fs.writeFile permissions_file, cmds.join('\n'), {encoding: 'utf8'}, (err) ->
    return next(err) if err

    exec "START \"\" \"#{permissions_file}\"", (err, stdout, stderr) ->
      next(err)


module.exports = {
  championTest: championTest
  setWindowsPermissions: setWindowsPermissions
}
