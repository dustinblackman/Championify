# Championify

_Champion-If-Ayyy_

[![Join the chat at https://gitter.im/dustinblackman/Championify](https://img.shields.io/badge/%E2%8A%AA%20GITTER%20-JOIN%20CHAT%20%E2%86%92-brightgreen.svg?style=flat)](https://gitter.im/dustinblackman/Championify?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Travis](https://img.shields.io/travis/dustinblackman/Championify/master.svg)](https://travis-ci.org/dustinblackman/Championify/builds)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/dt20uyoxt2skgneu/branch/master?svg=true)](https://ci.appveyor.com/project/dustinblackman/championify/branch/master)
[![Coverage Status](https://img.shields.io/coveralls/dustinblackman/Championify/master.svg)](https://coveralls.io/github/dustinblackman/Championify?branch=master)
[![Dependency Status](https://david-dm.org/dustinblackman/Championify.svg)](https://david-dm.org/dustinblackman/Championify)
[![devDependency Status](https://david-dm.org/dustinblackman/Championify/dev-status.svg)](https://david-dm.org/dustinblackman/Championify#info=devDependencies)
<a href="https://zenhub.io"><img src="https://img.shields.io/badge/KanBan%20Board-Zenhub.io-blue.svg"></a>
[![Translations](https://img.shields.io/badge/Translations-OneSky-2ea8e6.svg)](https://dustinblackman.oneskyapp.com/collaboration/project/95440)

Latest Release Downloads: [![Downloads](https://img.shields.io/github/downloads/dustinblackman/Championify/latest/total.svg)](https://github.com/dustinblackman/Championify/releases/latest)

Championify is a little program that downloads all the recent builds from Champion.gg and imports them in to your League of Legends to use within game! No hassle. Now with customization settings and a GUI!

Windows and OSX are both supported, tested on Windows 8.1 and OSX 10.10.1.

![screenshot](https://i.imgur.com/2W3rKzK.png)

Check out some more screenshots [here](https://imgur.com/2W3rKzK,ADYZ9ED,KNVRFs7,umDkx5j,scpQPBH,GpHtwKt#0)!

Note this application is still in development, as far as I've tested it's worked great, but don't get overly surprised if you find a bug or two.

This application is inspired by [ebildude123](https://github.com/ebildude123/champion.gg-item-set-creator) item set creator done in PHP.

---

## Features
- Summoners Rift and ARAM Item Sets
- Skill Priorities lists
- Automatically save preference settings
- Does not touch other item sets that you or other applications create

---

## Downloads
Found [here](https://github.com/dustinblackman/Championify/releases/latest)

---

## [Change Log](CHANGELOG.md)
<a name="0.4.1" />
### 0.4.1 (July 20th, 2015)

### Bug Fixes
- Grammar fixes (thanks iKevinY!)
- Mark log upload as failed if it can't be opened
- AJAX requests error instance (cause there was none...)
- Update error message for tips on how to fix

<a name="0.4.0" />
### 0.4.0 (July 20th, 2015)

### Features
- Give user ability to set Trinkets and/or Consumables to top or bottom of item set
- Automatically save preferences and League directory
- Item sets file structure now follows Riot standards
- Add error/crash message for when something breaks
- New error log reporting system
- Switch from Bootstrap to Semantic UI (New buttons, progress bar, layout)

### Bug Fixes
- Multiple windows opening when clicking browse
- Improved path handling
- Grammar fixes
- Tooltips so they're easier to view

### Notes
- ARAM builds still in Beta, still haven't decided what I want to do with them.

---

## BUT WAIT! I have a suggestion!
Well that's great! Put up an Issue, hit me up on [Gitter](https://gitter.im/dustinblackman/Championify), or send me a message on reddit [/u/dustinheroin](https://www.reddit.com/user/dustinheroin) and I'll try to get it when I can.

## Contribute
If you can code Coffeescript, feel free to make a pull request.
Make sure to check out my [Zenhub board](https://github.com/dustinblackman/Championify#boards?repos=34264106) so we don't have any conflicts if I or someone else has already started on an issue. :)

#### Rules:
- Must pass all tests. `npm test`
- Must write tests for all new functions (look at current tests for examples, still a WIP).
- Functions must be camel cased. `downloadStuff()`
- Variables must be underscored. `my_champion = 'teemo'`

I suggest making sure your linters are setup correctly, or run gulp lint every now and again.

### Translations
I use a [Onesky](https://dustinblackman.oneskyapp.com/collaboration/project/95440) to manage all my translations, it's super easy, includes initial English text, screenshots, and lets everyone contribute! Check it out. Please prevent from putting translations in PRs, I'd rather keep those for code.

---

<a name="faq" />
## Frequently Asked Questions
#### Be more descriptive, what does this actually do?
Well it's easy really. Here's a link for [Teemo's most popular build in top lane](http://champion.gg/champion/Teemo) that Champion.gg has tracked. We take this information and save it in a way that League of Legends likes so you can have the exact builds in game!


#### Is it safe?
Yep it's safe! Were not modifying League of Legends at all, so no rules broken there. And my code is clean and free to browse, so no smelly virus' or surprises. I've added VirusTotal report to all my recent releases just to be sure. If you still don't trust my executables, have a tech buddy look over my code themselves and you can build from [source](#source).

<a name="autoupdate_error" />
#### I just opened Championify to find a black window, or just an error pop up?
If you have version 0.2.0 or lower, that's my fault, sorry about that. I made a mistake with my Auto Updater that caused the issue. Redownload the latest version and this shouldn't happen again. Found [here](https://github.com/dustinblackman/Championify/releases/latest).


#### How do I make this work on Windows?
Run Championify.exe, the app will try and look for your League of Legends folder for you. If the app can't find it, browse to your League of Legends folder where lol.launcher.exe is saved (LoLLauncher.exe for Garena installations).


#### How do I make this work on Mac?
Run Championify, the app will try and look for your League of Legends.app for you. If the app can't find it, browse and select your League of Legends.app.


#### Why do I not see the item sets in the launcher?
Due to Riot restrictions, you can only see the item sets in game, you won't see them in the launcher.


#### Why does this not work on XP, Vista, or OSX Lion?
Sorry, Electron doesn't support anything below 7 or Mountain Lion. There's no plans to support it.


#### "App can’t be opened because it is from an unidentified developer"
Read [this](http://osxdaily.com/2012/07/27/app-cant-be-opened-because-it-is-from-an-unidentified-developer/) to fix it.


#### AAHHHH! SOMETHING BROKE! IT'S ALL MESSED UP!
Calm down, I gotcha! If something went wrong it means something has changed that I did not expect. Follow the steps [below](#uninstall) in the next FAQ question to remove Championify's builds.


<a name="uninstall" />
#### Nah bro, I don't like this. How can I delete all your builds?
I'm sorry you don't like it, hopefully I'll have it live up to your expectations one day! As for deleting, just hit the "Delete" button in Championify and it'll remove all the items sets generated by Championify.


#### Should I be running this everyday?
Oh no not at all, that's the last thing you want to do. The best time to run Championify is 3-4 day after a major patch comes out. Only got to do it once.


#### Why do you force auto updates?
If something was to change on Riots end and Championify's item sets broke your client or completely screwed up one of your games, you'd be pretty pissed right? I know I would be. This is just one method to make sure you run in to the least amount of problems possible, plus the update are under ~4MB anyway.


#### Why is my antivirus complaining about lolflavor?
Let me guess, BitDefender? I know, I got it running too. For some reason they have lolflavor marked as malware, which I've checked myself and it's not. To add, Championify never loads a lolflavor page, so even if there was malware laying around Championify would never open it. See [virus total report here](https://www.virustotal.com/en/url/576b112b6ae43a58f00176c5efe8f9456fa16dcfcf4e341e17f6c68c6a5e0e88/analysis/1435015572/). To fix the issue, add "lolflavor.com" to your exceptions in your anti virus.


#### If this has been done before, why did you do it again?
Well for a few reasons. [ebildude123](https://github.com/ebildude123/champion.gg-item-set-creator) original script is in PHP, and I wanted to do some changes and I don't like PHP in the slightest. Another issue is that the greater part of the world doesn't have PHP installed by default making the use of his script very difficult, plus you have a good number of people who automatically run in fear when they have to open a command prompt. My solution is a simple .exe/.app where you run and follow the instructions. Much easier.


#### Why is your script so slow?
Well damn, you must be pretty impatient if you think that's slow... The script is slowed on purpose so users don't spam Champion.gg's servers. They're doing great great stuff over there and the last thing I'd want to do is cause them trouble. However if it's REALLY slow, then you should consider upgrading your dial up connection.


#### Why is the file size so big?
I use Electron to wrap my GUI, and unfortunately it's a bit big. I'd rather the App just work then worry about size.

---

## Future Plans
Check out the [Features tag in Issues](https://github.com/dustinblackman/Championify/labels/feature) to see all up and  coming ideas.


---

<a name="source" />
## Build From Source
You must have iojs 2.3.1 installed on your system (thats what Electron is using), git clone the repo and run the following in the root folder.

```console
npm install -g gulp
npm install
npm run build
```

You'll find a Championify.exe/Championify.app in the releases folder.

Wine is required if building on Mac for Windows.
```console
brew install wine
```

---

## Credit
- Icon by [OmerValentine](https://twitter.com/omervalentine)
- [Joeldo](https://www.reddit.com/user/joeldo) of [Champion.gg](http://champion.gg)
- [Lolflavor](http://www.lolflavor.com/)

---

## [License](LICENSE)

Championify isn't endorsed by any of it's content sources or Riot Games and doesn't reflect the views or opinions of them or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.
