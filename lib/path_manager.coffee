fs = require 'fs'
glob = require 'glob'
path = require 'path'
_ = require 'lodash'

###*
 * Function Auto discovery of League installation.
###
findInstallPath = ->
  userHome = process.env.HOME || process.env.USERPROFILE

  # TODO: Fix.
  # notFound = ->
    # $('#input_msg').text(window.browse_title)

  if process.platform == 'darwin'
    if fs.existsSync('/Applications/League of Legends.app')
      @setInstallPath null, '/Applications/League of Legends.app/', 'Contents/LoL/Config/Champions/'

    else if fs.existsSync(userHome + '/Applications/League of Legends.app')
      @setInstallPath null, userHome + '/Applications/League of Legends.app/', 'Contents/LoL/Config/Champions/'
    else
      # notFound()

  else
    if fs.existsSync('C:/Riot Games/League Of Legends/lol.launcher.exe')
      @setInstallPath null, 'C:/Riot Games/League Of Legends/', 'Config/Champions/', 'lol.launcher.exe'
    else
      # notFound()


###*
 * Function Verifies the users selected install paths. Warns if no League related files/diretories are found.
 * @param {String} User selected path
###
checkInstallPath = (selected_path, done) ->
  selected_path = selected_path[0] if selected_path and !_.isString(selected_path)

  # Verify is valid a path
  try
    fs.lstatSync(selected_path)
  catch e
    $('#input_msg').addClass('red')
    $('#input_msg').text("#{T.t('invalid_path')}")
    return

  if process.platform == 'darwin'
    if fs.existsSync(path.join(selected_path, 'Contents/LoL/'))
      done null, selected_path, 'Contents/LoL/Config/Champions/'

    else if fs.existsSync(path.join(selected_path, 'League of Legends.app'))
      done null, path.join(selected_path, 'League of Legends.app'), 'Contents/LoL/Config/Champions/'

    else
      done new Error('Path not found'), selected_path

  else
    # Riot
    default_path = path.join(selected_path, 'lol.launcher.exe')
    garena_check_one = path.join(selected_path, 'lol.exe')
    garena_check_two = glob.sync(path.join(selected_path, 'LoL*Launcher.exe'))[0]

    # Default install,
    if fs.existsSync(default_path)
      done null, selected_path, 'Config/Champions/', path.basename(default_path)

    # Garena Check 1
    else if fs.existsSync(garena_check_one)
      done null, selected_path, 'Game/Config/Champions/', path.basename(garena_check_one)

    # Garena Check 2
    else if garena_check_two
      garena_version = path.basename glob.sync(path.join(selected_path, 'GameData/Apps/*'))[0]
      done null, selected_path, "GameData/Apps/#{garena_version}/Game/Config/Champions/", path.basename(garena_check_two)

    else
      done new Error('Path not found'), selected_path


###*
 * Function Sets the path string for the user to see on the interface.
 * @param {String} If !=, explains path error
 * @param {String} Install path
 * @param {String} Champion folder path relative to Install Path
###
setInstallPath = (path_err, install_path, champ_path, executable) ->
  enableBtns = ->
    $('#import_btn').removeClass('disabled')
    $('#delete_btn').removeClass('disabled')

  pathErr = ->
    $('#input_msg').addClass('yellow')
    $('#input_msg').text("#{T.t('sure_thats_league')}")
    enableBtns()

  foundLeague = ->
    $('#input_msg').addClass('green')
    $('#input_msg').text("#{T.t('found')} League of Legends!")
    enableBtns()

  $('#input_msg').removeAttr('class')
  $('#input_msg').text('')

  if !champ_path
    if process.platform == 'darwin'
      champ_path = 'Contents/LoL/Config/Champions/'
    else
      champ_path = 'Config/Champions/'

  window.lol_install_path = install_path
  window.lol_champ_path = champ_path
  window.lol_executable = executable
  window.item_set_path = path.join(install_path, champ_path)
  $('#install_path').val(install_path)

  return pathErr() if path_err
  foundLeague()


module.exports = {
  findInstallPath: findInstallPath
  checkInstallPath: checkInstallPath
  setInstallPath: setInstallPath
}
