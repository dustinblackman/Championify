fs = require 'fs'
path = require 'path'

###*
 * Function Auto discovery of League installation.
###
findInstallPath = ->
  userHome = process.env.HOME || process.env.USERPROFILE

  # TODO: Fix.
  notFound = ->
    # $('#input_msg').text(window.browse_title)

  if process.platform == 'darwin'
    if fs.existsSync('/Applications/League of Legends.app')
      @setInstallPath null, '/Applications/League of Legends.app/', 'Contents/LoL/Config/Champions/'

    else if fs.existsSync(userHome + '/Applications/League of Legends.app')
      @setInstallPath null, userHome + '/Applications/League of Legends.app/', 'Contents/LoL/Config/Champions/'
    else
      notFound()

  else
    if fs.existsSync('C:/Riot Games/League Of Legends/lol.launcher.exe')
      @setInstallPath null, 'C:/Riot Games/League Of Legends/', 'Config/Champions/', 'lol.launcher.exe'
    else
      notFound()


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
    $('#input_msg').text('Invalid Path')
    return

  if process.platform == 'darwin'
    if fs.existsSync(path.join(selected_path, 'Contents/LoL/'))
      done null, selected_path, 'Contents/LoL/Config/Champions/'

    else if fs.existsSync(path.join(selected_path, 'League of Legends.app'))
      done null, path.join(selected_path, 'League of Legends.app'), 'Contents/LoL/Config/Champions/'

    else
      done new Error('Path not found'), selected_path

  else
    garena_glob = glob.sync(path.join(selected_path, 'GameData/Apps/**/Game/Config/'))
    garena_path = path.join(selected_path, 'League of Legends.exe')
    default_path = path.join(selected_path, 'lol.launcher.exe')

    # Default install, Garena Check 1
    if fs.existsSync(default_path) or fs.existsSync(garena_path)
      executable = if fs.existsSync(garena_path) then 'League of Legends.exe' else 'lol.launcher.exe'
      done null, selected_path, 'Config/Champions/', executable

    # Garena Installation Check 2
    else if fs.existsSync(path.join(selected_path, 'LoLLauncher.exe')) and garena_glob
      executable = 'LoLLauncher.exe'
      garena_split = garena_glob[0].split('/')
      garena_version = garena_split[garena_split.length - 4]
      done null, selected_path, 'GameData/Apps/' + garena_version + '/Game/Config/Champions/', executable

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
    $('#input_msg').text('You sure that\'s League?')
    enableBtns()

  foundLeague = ->
    $('#input_msg').addClass('green')
    $('#input_msg').text('Found League of Legends!')
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
