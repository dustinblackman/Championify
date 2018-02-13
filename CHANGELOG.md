# Changelog

<a name="2.1.5" />
## 2.1.5 (February 12th, 2018)

#### Bug Fixes
- Handle when LolAlytics is missing skill orders [#386](https://github.com/dustinblackman/Championify/issues/386)

<a name="2.1.4" />
## 2.1.4 (January 29th, 2018)

#### Bug Fixes
- Fixed Probuilds not downloading any item sets. [#382](https://github.com/dustinblackman/Championify/issues/382)
- Fixed cursor type on footer links. [#383](https://github.com/dustinblackman/Championify/pull/383) (Thanks [mnlkrs](https://github.com/mnlkrs))

<a name="2.1.3" />
## 2.1.3 (November 22nd, 2017)

#### Bug Fixes
- Fixed windows builds not being signed correctly. Some users may be forced to reinstall. Fixes #366 and #370.

<a name="2.1.2" />
## 2.1.2 (November 22nd, 2017)

#### Bug Fixes
- Fixed garena path checking. [#367 @hollowsxd](https://github.com/dustinblackman/Championify/pull/367)

<a name="2.1.1" />
## 2.1.1 (November 10th, 2017)

#### Bug Fixes
- Fixed op.gg to work with updated website

<a name="2.1.0" />
## 2.1.0 (October 31st, 2017)

#### Features
- Added initial Hindi and Khmer translations

#### Bug Fixes
- Updated German translations
- Fixed Lolflavor endpoints

<a name="2.0.11" />
## 2.0.11 (October 17th, 2017)
- Fixed parsing bug with Koreanbuilds. [#330](https://github.com/dustinblackman/Championify/issues/330)

#### Bug Fixes

<a name="2.0.10" />
## 2.0.10 (October 13th, 2017)

#### Bug Fixes
- Fixed Koreanbuilds not finding champions to import. [#346](https://github.com/dustinblackman/Championify/issues/346)

<a name="2.0.9" />
## 2.0.9 (October 3rd, 2017)

#### Bug Fixes
- Limits outbound requests to fix timeout errors on some systems. [#342](https://github.com/dustinblackman/Championify/pull/342) (Thanks [gerriet-hinrichs](http://github.com/gerriet-hinrichs))

<a name="2.0.8" />
## 2.0.8 (September 14th, 2017)

#### Bug Fixes
- Replaced special items with what they're built from (e.g Orns Molten Edge to Infinity Edge)

<a name="2.0.7" />
## 2.0.7 (August 15th, 2017)

#### Bug Fixes
- Fixed displaying lolmaster version
- Updated translations

<a name="2.0.6" />
## 2.0.6 (July 25th, 2017)

#### Bug Fixes
- Fixed routes bug with Champion.gg

<a name="2.0.5" />
## 2.0.5 (July 12th, 2017)

#### Bug Fixes
- Fixed French tooltip translation being cut
- Fixed Probuilds failing due to 404 with Kayn
- Fixed Serbian flag
- Fixed proper language translation for Polish

<a name="2.0.4" />
## 2.0.4 (March 4th, 2017)

#### Bug Fixes
- Fixed Champion.gg win percentage not being formatted correctly

<a name="2.0.3" />
## 2.0.3 (March 2nd, 2017)

#### Bug Fixes
- Fixed op.gg endpoints [#280](https://github.com/dustinblackman/Championify/issues/280)
- Allow imports to continue when a source is down [#276](https://github.com/dustinblackman/Championify/issues/276)
- Fixed issue with progress bar disappearing on a second import

<a name="2.0.2" />
## 2.0.2 (January 29th, 2017)

#### Bug Fixes
- Better error logging
- Handle errors from op.gg and probuilds [#237](https://github.com/dustinblackman/Championify/issues/237)
- Fix incorrect language being used on op.gg [#265](https://github.com/dustinblackman/Championify/issues/265) [#266](https://github.com/dustinblackman/Championify/issues/266)

<a name="2.0.1" />
## 2.0.1 (December 23rd, 2016)

#### Bug Fixes
- Fixed Lolalytics missing boots [#231](https://github.com/dustinblackman/Championify/issues/231)
- op.gg now uses Korean item sets [#232](https://github.com/dustinblackman/Championify/issues/232)
- Fixed command line arguments not working and updated docs [#234](https://github.com/dustinblackman/Championify/issues/234)
- Replaced elevate method that was giving false virus total reports [#239](https://github.com/dustinblackman/Championify/issues/239)

<a name="2.0.0" />
## 2.0.0 (December 21st, 2016)

#### Breaking Changes
- Completely replaced auto updater with [Squirrels](https://github.com/electron/electron/blob/master/docs/api/auto-updater.md) (built in to Electron) causing anything below 2.0.0 to break. __Manual reinstallation required.__ [#205](https://github.com/dustinblackman/Championify/issues/205)
- Renamed `--startLeague` option parameter to `--start-league`

#### Features
- Added op.gg, Probuilds, Lolalytics, and Lolmasters
- Changed donation method to Patreon [#151](https://github.com/dustinblackman/Championify/issues/151)
- Updated translations

#### Bug Fixes
- Added Control wards to consumables [#223](https://github.com/dustinblackman/Championify/issues/223)
- Fixed Wukong not showing up for some sources [#211](https://github.com/dustinblackman/Championify/issues/211)
- Fixed incorrect translation placement [#216](https://github.com/dustinblackman/Championify/issues/216)
- Replaced Windows elevate with standalone exe [#220](https://github.com/dustinblackman/Championify/issues/220)
- Fixed error message when Windows can't elevate
- Fixed error window being hidden and showing successful builds instead
- Fixed versions view to support more sources

#### Technical Features
- Updated to Node 6 / Electron 1.4.13
- Both Windows and macOS are now code signed to secure builds and updates [#123](https://github.com/dustinblackman/Championify/issues/123)
- Improved development experience on OSX
- Replaced Jade with Marko for faster renders

<a name="1.3.8" />
## 1.3.8 (November 14th, 2016)

#### Updates
- Added Control Ward

<a name="1.3.7" />
## 1.3.7 (November 3rd, 2016)

#### Bug Fixes
- Fixed some KoreanBuilds not showing up in game due to misnamed folders

#### Updates
- Updated translations

<a name="1.3.6" />
## 1.3.6 (August 24th, 2016)

#### Bug Fixes
- Removed BG and NL from supported Riot languages. Defaults to English.

<a name="1.3.5" />
## 1.3.5 (July 29th, 2016)

#### Fixes
- Hours after removing Lolflavor which had been down for weeks, it's now returned.

<a name="1.3.4" />
## 1.3.4 (July 28th, 2016)

#### Bug Fixes
- Lolflavor is dead, remove from the app
- Verify sources exist in code base before processing
- Fix KoreanBuilds scraper to show proper titles and split blocks
- Add trinkets to Korean Builds
- Fix missing blue trinket from all item sets

<a name="1.3.3" />
## 1.3.3 (April 6th, 2016)

#### Notes
- Disabled LeagueOfGraphs

<a name="1.3.2" />
## 1.3.2 (April 6th, 2016)

#### Bug Fixes
- Fixed bug when install path isn't correctly set and throws an error instead of a warning
- Fixed health pots missing
- Fixed duplicate items

<a name="1.3.1" />
## 1.3.1 (April 6th, 2016)

#### Bug Fixes
- Fix preferences not being loaded correctly after updating.

<a name="1.3.0" />
## 1.3.0 (April 6th, 2016)

#### Features
- Added KoreanBuilds and LeagueOfGraphs as sources
- Download multiple sources at once instead of just one
- New logo by Omer Levy (cause yeah, pretty is a feature)
- Updated latest translation

#### Bug Fixes
- Fixed skills sometimes broken on certain champs (Kha'Zix for example)
- Fixed various bugs with languages
- Added missing consumables
- Fixed sentences in specific languages being too long and pushing rows too far down
- Progress bar is more accurate

#### Technical Features
- Complete refactor
- Dropped Coffeescript, Lodash, and Async for ES6, Ramda, and Bluebird
- Dropped Bower
- Fixed development on Windows, `npm run dev` now works on both OSX and Windows
- Code consistency to follow new styling guidelines
- Removed anything that uses `window` for it's own module
- Updated electron to 0.35.4 (still uses Node 4)
- Improved error handling
- Improved logging
- Status view now shows in the full app (and scrolls like it did before)
- New sources can now be dropped in and the app will handle the rest (see CONTRIBUTE.md)
- Shrunk build size by 5MBs (deep cleaning of `node_modules` folder)
- Removed a bunch of unused/unneeded packages
- Docs written for the entire app to make contributing easier


<a name="1.2.11" />
## 1.2.11 (March 26th, 2016)

#### Bug Fixes
- Fix inconsistent ID format for Champions

<a name="1.2.10" />
## 1.2.10 (February 1st, 2016)

#### Bug Fixes
- Disable changing languages during import

<a name="1.2.9" />
## 1.2.9 (Janurary 30th, 2016)

#### Bug Fixes
- Added Arabic and Japanese to a whitelist so that it defaults to English when in game, gets rid of block text.

<a name="1.2.8" />
## 1.2.8 (Janurary 26th, 2016)

#### Bug Fixes
- Lolflavor import failing due to missing Nami item sets

<a name="1.2.7" />
## 1.2.7 (Janurary 2nd, 2016)

#### Bug Fixes
- Disabled `causedBy` error on updates once and for all.

<a name="1.2.6" />
## 1.2.6 (Janurary 2nd, 2016)

#### Updates
- Disabled `Send Log`
- Updated Translations

<a name="1.2.5" />
## 1.2.5 (December 14th, 2015)

#### Bug Fixes
- Fixed `causedBy` error

<a name="1.2.4" />
## 1.2.4 (December 13th, 2015)

#### Updates
- Updated translations

<a name="1.2.3" />
## 1.2.3 (November 26th, 2015)

#### Bug Fixes
- Another temporary fix for users with `Unexpected end of input` and `roles` errors

<a name="1.2.2" />
## 1.2.2 (November 25th, 2015)

#### Bug Fixes
- Temporary fix for users with `Unexpected end of input` errors

#### Updates
- Updated translations

<a name="1.2.1" />
## 1.2.1 (November 24th, 2015)

#### Bug Fixes
- Fix Champion.gg 404 error

<a name="1.2.0" />
## 1.2.0 (November 20th, 2015)

#### Features
- Added Arabic
- Translated item sets titles for Champion.gg and Lolflavor
- Added donation button

#### Bug Fixes
- Infinite black box loop on some Windows machines

#### Updates
- Updated translations

<a name="1.1.2" />
## 1.1.2 (November 3rd, 2015)

#### Updates
- Updated translations

<a name="1.1.1" />
## 1.1.1 (October 23rd, 2015)

#### Updates
- Updated translations

<a name="1.1.0" />
## 1.1.0 (October 13th, 2015)

#### Features
- Added 13 new languages. Bosnian, Catalan, Croatian, Danish, Finnish, Georgian, Lithuanian, Latvian, Norwegian, Slovak, Slovenian, Serbian, and Swedish.

#### Bug Fixes
- Github link not working
- ARAM item sets are now optional (will fix users having issues with Lolflavor and their antivirus)

#### Updates
- All languages with user submitted translations have been reviewed and added.


<a name="1.0.3" />
## 1.0.3 (October 10th, 2015)

#### Bug Fixes
- Fixed infinite loop on updates for Windows

<a name="1.0.2" />
## 1.0.2 (October 8th, 2015)

#### Bug Fixes
- Fixed translation issue with ARAM item sets fail due to antivirus

<a name="1.0.1" />
## 1.0.1 (October 7th, 2015)

#### Bug Fixes
- Fix `cannot read property split of undefined` when checking for Lolflavor version
- Lolflavor ARAM builds are skipped if there's a firewall issue instead of app crashing (temporary fix)
- Fix `Open Log` button on Windows
- Fix crash when importing in Portuguese

<a name="1.0.0" />
## 1.0.0 (October 6th, 2015)

#### Breaking Changes
- Auto updater will not work with older versions of Championify for Windows users. __Please manually redownload.__

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
- Add progress bar to updates view

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

#### Technical Notes and Features
- Complete code rework (nearly written from the ground up)
- Auto updater now supports complete client replacements (major updates)
- Test suite, CI, and coverage integrations to simplify and encourage PRs
- Bleeding edge builds (off all branches)

#### Translations

__Thanks to__
- [@OmerValentine](https://github.com/OmerValentine) for the Hebrew translations
- [@secretdataz](https://github.com/secretdataz) for the Thai translations
- [@FreakyDeluxe](https://github.com/FreakyDeluxe) for the French translations
- [@PrototypeGR](https://github.com/PrototypeGR) for the Greek translations
- [@pcastro94](https://github.com/pcastro94) for the Portuguese and Brazilian Portuguese translations


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
