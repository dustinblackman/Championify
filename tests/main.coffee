spawn = require('child_process').spawn
fs = require 'fs'
webdriver = require 'selenium-webdriver'

chromedriver_path = require('../node_modules/chromedriver/lib/chromedriver').path
electron_path = fs.readFileSync('../node_modules/electron-prebuilt/path.txt', {'encoding': 'utf8'})

cp = spawn(chromedriver_path)
cp.stdout.pipe(process.stdout)
cp.stderr.pipe(process.stderr)
# cp.kill('SIGTERM')

# console.log(chromedriver_path)
# console.log(electron_path)

driver = new webdriver.Builder()
  .usingServer 'http://localhost:9515'
  .withCapabilities {
    binary: electron_path
  }
  .forBrowser 'electron'
  .build()
