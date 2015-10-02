# Changelog

<a name="1.0.0" />
## 1.0.0 (October ??th, 2015)

#### Breaking Changes
- Auto updater will not work with older versions of Championify for Windows users.

#### Features
- Supports 25 (kinda badly translated...) languages
- New borderless window design
- Brand new animations, because they're pretty
- Select either Champion.gg or Lolflavor for Item Sets source
- Command line parameters for automation
- ARAM starters now have Oracle's Extract
- Add complete view, with a close button and start League button
- Shows versions on main view. You can now see Champion.gg's, LolFlavors, Riots, and your own item sets patch version when you start the app.
- Deleting old items sets that don't have new versions is now an option instead of forced
- Open log button
- Show error message on error view

#### Bug Fixes
- Faster app loading time
- Less errors when scraping Champion.gg
- Windows installer supports all languages the app supports.
- Bash script not always starting for updates on Windows.
- Permissions errors on Windows now asks to be runned as admin automatically.
- Importer tests write permissions before running import, and elevates when needed.
- Auto updater checks for write permissions
- Fix black text sticking on highlight
- Allow the ability to copy/paste your League directory
- Garena path patches
- Fix UI differences between OSX and Windows

#### Technical Features
- Complete code rework (nearly written from the ground up)
- Auto updater now supports complete client replacements (major updates)
- Test suite, CI, and coverage integrations to simplify and encourage PRs
- Bleeding edge builds (off all branches)

<a name="0.4.1" />
## 0.4.1 (July 20th, 2015)

#### Bug Fixes
- Grammar fixes (thanks iKevinY!)
- Mark log upload as failed if it can't be opened
- AJAX requests error instance (cause there was none...)
- Update error message for tips on how to fix

<a name="0.4.0" />
## 0.4.0 (July 20th, 2015)

#### Features
- Give user ability to set Trinkets and/or Consumables to top or bottom of item set
- Automatically save preferences and League directory
- Item sets file structure now follows Riot standards
- Add error/crash message for when something breaks
- New error log reporting system
- Switch from Bootstrap to Semantic UI (New buttons, progress bar, layout)

#### Bug Fixes
- Multiple windows opening when clicking browse
- Improved path handling
- Grammar fixes
- Tooltips so they're easier to view

#### Notes
- ARAM builds still in Beta, still haven't decided what I want to do with them.

<a name="0.3.2" />
## 0.3.2 (July 10th, 2015)

#### Bug Fixes
- Incorrect callback used when a new champ is introduced.

<a name="0.3.1" />
## 0.3.1 (June 17th, 2015)

#### Features
- New Icon
- Added background and changed progress bar

#### Bug Fixes
- Remove last digit of Riot version for ARAM builds.

<a name="0.3.0" />
### 0.3.0 (June 15th, 2015)

#### Features
- ARAM Item Sets
- Delete "Championify Item Sets" Button
- Lock ChampionGG Item Sets to Summoners Rift (so they don't pop up in ARAM games)
- Scrollable progress log
- Windows Setup Installer (So you can now install Championify instead of extracing ZIPs)

#### Bug Fixes
- Fix styling issue where footer and progress log overlapped on Windows
- Better execution flow to improve speed
- Progress bar now shows up in Windows Tray/OSX Dock
- Better retry setup for when connections fail
- Code cleanup

<a name="0.2.2" />
## 0.2.2 (May 27th, 2015)

#### Bug Fixes
- Handle champs that have yet to be released.

<a name="0.2.1" />
## 0.2.1 (May 18th, 2015)

#### Bug Fixes
- Auto updater correctly follows Github redirects.
- Auto updater styling

<a name="0.2.0" />
## 0.2.0 (May 18th, 2015)

#### Features
- Added progress bar [#30](https://github.com/dustinblackman/Championify/issues/30)
- Added first four skill upgrades to short skills (Trinkets | Frequent: E.W.Q.E - E>W>Q) [#32](https://github.com/dustinblackman/Championify/issues/32)
- Add "Browse for League folder" above input box [#14](https://github.com/dustinblackman/Championify/issues/14)

#### Bug Fixes
- Directory confirmations are more obvious [#28](https://github.com/dustinblackman/Championify/issues/28)
- Capitalize 'ADC' Item Set title. [#25](https://github.com/dustinblackman/Championify/issues/25)
- Use Champion.GG's client version instead of Riot's for Item Sets [#17](https://github.com/dustinblackman/Championify/issues/17)
- Change title of split item sets [#16](https://github.com/dustinblackman/Championify/issues/16)

<a name="0.1.0" />
## 0.1.0 (May 14th, 2015)

##### Features
- New GUI, no more Terminal Windows.
- Processing speed is stupid fast (I even had to slow it down...)
- Easier to read Progress Report.
- Split item sets between Most Frequent and Highest Wins. [#2](https://github.com/dustinblackman/Championify/issues/2)
- Enable/Disable Trinkets and Consumables. [#6](https://github.com/dustinblackman/Championify/issues/6)
- Switch between full skill priorities (Q.W.E.Q.W.R.Q ect) and shortened priorities (Q>E>W). [#8](https://github.com/dustinblackman/Championify/issues/8)
- Hover over checkbox settings to see tooltips explaining what each setting does.
- Better LoL Installation Auto Discovery. [#9](https://github.com/dustinblackman/Championify/issues/9)
- Allow user to select install directory.
- Auto Updater. [#7](https://github.com/dustinblackman/Championify/issues/7)
- Virus Total reports included in all future releases.

##### Bug Fixes
- Windows write tests writes to LoL root directory instead of Champion directory. [#12](https://github.com/dustinblackman/Championify/issues/12)
- LoL directory check is no longer forced, only warnings.
- Swapped out scraping CSS paths to using available JSON data.
- Scrape 2 pages at a time instead of 5, because 5 got way too fast.
- Handle undefined builds (happens usually just after a new patch)
- Handle Connection/Timeout Errors (Timeout is 10 seconds.) [#11](https://github.com/dustinblackman/Championify/issues/11)


<a name="0.0.4" />
## 0.0.4 (May 2nd, 2015)

##### Bug Fixes
- On Windows: Write a test file to LoL directly instead of forcing to run as admin. Warn if write is not possible.

<a name="0.0.3" />
## 0.0.3 (April 22nd, 2015)

##### Bug Fixes
- Garena patch.

<a name="0.0.2" />
## 0.0.2 (April 21st, 2015)
##### Features
- Swapped position of Trinkets and Consumables.
- Added Skills priorities to Trinket and Consumables titles. [Image](http://i.imgur.com/GpHtwKt.png)
- If Frequent and Highest builds are the same, they only show up once. [Image](http://i.imgur.com/2ULTImE.png)
- **Garena support** that checks for two different directories. Thanks to [secretdataz](https://github.com/secretdataz) for one of them.

##### Bug Fixes
- HTTP Requests have a timeout of 60.

<a name="0.0.1" />
## 0.0.1 (April 20th, 2015)
- Initial Release
