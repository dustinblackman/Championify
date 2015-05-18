# Changelog

<a name="0.2.0" />
### 0.2.0 (May 18th, 2015)

### Features
- Added progress bar [#30](https://github.com/dustinblackman/Championify/issues/30)
- Added first four skill upgrades to short skills (Trinkets | Frequent: E.W.Q.E - E>W>Q) [#32](https://github.com/dustinblackman/Championify/issues/32)
- Add "Browse for League folder" above input box [#14](https://github.com/dustinblackman/Championify/issues/14)

### Bug Fixes
- Directory confirmations are more obvious [#28](https://github.com/dustinblackman/Championify/issues/28)
- Capitalize 'ADC' Item Set title. [#25](https://github.com/dustinblackman/Championify/issues/25)
- Use Champion.GG's client version instead of Riot's for Item Sets [#17](https://github.com/dustinblackman/Championify/issues/17)
- Change title of split item sets [#16](https://github.com/dustinblackman/Championify/issues/16)

<a name="0.1.0" />
### 0.1.0 (May 14th, 2015)

#### Features
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

#### Bug Fixes
- Windows write tests writes to LoL root directory instead of Champion directory. [#12](https://github.com/dustinblackman/Championify/issues/12)
- LoL directory check is no longer forced, only warnings.
- Swapped out scraping CSS paths to using available JSON data.
- Scrape 2 pages at a time instead of 5, because 5 got way too fast.
- Handle undefined builds (happens usually just after a new patch)
- Handle Connection/Timeout Errors (Timeout is 10 seconds.) [#11](https://github.com/dustinblackman/Championify/issues/11)


<a name="0.0.4" />
### 0.0.4 (May 2nd, 2015)

#### Bug Fixes
- On Windows: Write a test file to LoL directly instead of forcing to run as admin. Warn if write is not possible.

<a name="0.0.3" />
### 0.0.3 (April 22nd, 2015)

#### Bug Fixes
- Garena patch.

<a name="0.0.2" />
### 0.0.2 (April 21st, 2015)
#### Features
- Swapped position of Trinkets and Consumables.
- Added Skills priorities to Trinket and Consumables titles. [Image](http://i.imgur.com/GpHtwKt.png)
- If Frequent and Highest builds are the same, they only show up once. [Image](http://i.imgur.com/2ULTImE.png)
- **Garena support** that checks for two different directories. Thanks to [secretdataz](https://github.com/secretdataz) for one of them.

#### Bug Fixes
- HTTP Requests have a timeout of 60.

<a name="0.0.1" />
### 0.0.1 (April 20th, 2015)
- Initial Release
