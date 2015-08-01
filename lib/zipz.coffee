async = require 'async'
exec = require('child_process').exec
fs = require 'fs'
mkdirp = require 'mkdirp'
path = require 'path'
yauzl = require 'yauzl'
_ = require 'lodash'

# Fix for when using zipz between Championify and Gulp
window = {log: {error: console.log}} if !window

_modeFromEntry = (entry) ->
  attr = entry.externalFileAttributes >> 16 or 33188
  [448, 56, 7].map (mask) ->
    attr & mask
  .reduce (a, b) ->
    a + b
  , attr & 61440


_mtimeFromEntry = (entry) ->
  yauzl.dosDateTimeToDate entry.lastModFileDate, entry.lastModFileTime


_processEntry = (zip, dest, entry, done) ->
  stat = new (fs.Stats)
  stat.mode = _modeFromEntry(entry)
  stat.mtime = _mtimeFromEntry(entry)

  console.log(entry.fileName)

  if stat.isDirectory()
    mkdirp path.join(dest, entry.fileName)
    return done()

  else if stat.isFile()
    zip.openReadStream entry, (err, readStream) ->
      return done(err) if err

      file_dest = path.join(dest, entry.fileName)

      # For some reason when extracting Windows archives, the directory is never listed by itself.
      # We gotta catch it before a write_stream is created.
      dest_dir = path.parse(file_dest).dir
      mkdirp dest_dir if !fs.existsSync(dest_dir)

      write_stream = fs.createWriteStream(file_dest)
      readStream.pipe write_stream
      write_stream.on 'finish', ->
        exec('chmod +x "' + file_dest + '"') if stat.mode == 33261
        return done()

  else if stat.isSymbolicLink()
    zip.openReadStream entry, (err, readStream) ->
      return done(err) if err

      symlink_path = ''
      readStream.on 'data', (c) -> symlink_path += c
      readStream.on 'end', ->
        fs.symlinkSync symlink_path, path.join(dest, entry.fileName)
        return done()
      readStream.on 'error', (err) ->
        return done(err) if err


extract = (zipfile, dest, done) ->
  if _.isFunction(dest)
    done = dest
    dest = './'

  yauzl.open zipfile, {autoClose: false}, (err, zip) ->
    return done(err) if err
    wasError = null

    # Create destination directory
    mkdirp dest

    # Startup Queue
    Q = async.queue (entry, next) ->
      _processEntry zip, dest, entry, (err) ->
        if err
          window.log.error err
          wasError = true
        next()
    , 10000 # Yolo.

    # Interate zip
    zip.on 'entry', (entry) ->
      Q.push(entry) if !wasError

    zip.on 'end', ->
      close = ->
        zip.close()
        return done(wasError)

      return close() if !Q.length()
      Q.drain = close


module.exports = {
  extract: extract
}
