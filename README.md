# Championify

_Champion-If-Ayyy_

[![Donate](https://img.shields.io/badge/Donate-BountySource-5cb85c.svg)](https://salt.bountysource.com/teams/championify)
[![Join the chat at https://gitter.im/dustinblackman/Championify](https://img.shields.io/badge/%E2%8A%AA%20GITTER%20-JOIN%20CHAT%20%E2%86%92-brightgreen.svg?style=flat)](https://gitter.im/dustinblackman/Championify?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![ProjectTalk](http://www.projecttalk.io/images/gh_badge-3e578a9f437f841de7446bab9a49d103.svg?vsn=d)](http://www.projecttalk.io/boards/dustinblackman%2FChampionify?utm_campaign=gh-badge&utm_medium=badge&utm_source=github)
[![Travis](https://img.shields.io/travis/dustinblackman/Championify/master.svg)](https://travis-ci.org/dustinblackman/Championify/builds)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/dt20uyoxt2skgneu/branch/master?svg=true)](https://ci.appveyor.com/project/dustinblackman/championify/branch/master)
[![Coverage Status](https://img.shields.io/coveralls/dustinblackman/Championify/master.svg)](https://coveralls.io/github/dustinblackman/Championify?branch=master)
[![Dependency Status](https://david-dm.org/dustinblackman/Championify.svg)](https://david-dm.org/dustinblackman/Championify)
[![devDependency Status](https://david-dm.org/dustinblackman/Championify/dev-status.svg)](https://david-dm.org/dustinblackman/Championify#info=devDependencies)
<a href="https://zenhub.io"><img src="https://img.shields.io/badge/KanBan%20Board-Zenhub.io-blue.svg"></a>
[![Translations](https://img.shields.io/badge/Translations-Transifex-135d91.svg)](https://www.transifex.com/dustinblackman/championify)

Latest Release Downloads: [![Downloads](https://img.shields.io/github/downloads/dustinblackman/Championify/latest/total.svg)](https://github.com/dustinblackman/Championify/releases/latest)

Championify is a little program that downloads all the recent builds from websites like Champion.gg or Lolflavor and imports them in to your League of Legends to use within game! No hassle. Now with 38 languages and new features!

Windows and OSX are both supported, tested on Windows 10 and OSX 10.11.1.

<img src="https://i.imgur.com/iexHBvL.png">

Check out some more screenshots [here](https://imgur.com/a/zL0R2/all)!

---

## Announcement

Championify is not dead! For all those concerned that Championify would stop working with the new server side item sets, don't you worry, everything is still working as expected. :)

## Features
- Summoners Rift and ARAM Item Sets
- Skill Priorities lists (Q.W.E.Q.E.R ect)
- 39 Languages
- Bunch of preferences to display item sets in the way you prefer
- Automation using command line preferences (simpler system coming soon)
- Automatically save preference settings
- Garena support
- Does not touch other item sets that you or other applications create


## Downloads
Found [here](https://github.com/dustinblackman/Championify/releases/latest)


## [Change Log](CHANGELOG.md)

<a name="1.2.11" />
### 1.2.11 (March 26th, 2016)

#### Bug Fixes
- Fix lolflavor import bug

#### Bug Fixes
- Lolflavor import failing due to missing Nami item sets


## BUT WAIT! I have a suggestion!
Well that's great! Put up an Issue, hit me up on [Gitter](https://gitter.im/dustinblackman/Championify), or send me a message on reddit [/u/dustinheroin](https://www.reddit.com/user/dustinheroin) and I'll try to get it when I can.

## Contribute
Please see [CONTRIBUTE.md](CONTRIBUTE.md)


<a name="faq" />
## Frequently Asked Questions
#### Be more descriptive, what does this actually do?
Well it's easy really. Here's a link for [Teemo's most popular build in top lane](http://champion.gg/champion/Teemo) that Champion.gg has tracked. We take this information and save it in a way that League of Legends likes so you can have the exact builds in game!


#### Is it safe?
Yep it's safe! Were not modifying League of Legends at all, and got the clear thanks to [Riot's item sets docs](https://developer.riotgames.com/docs/item-sets) . And my code is clean and free to browse, so no smelly virus' or surprises. I've added VirusTotal report to all my recent releases just to be sure. If you still don't trust my executables, have a tech buddy look over my code themselves and you can build from [source](#source).


#### How do I make this work on Windows?
Run Championify.exe, the app will try and look for your League of Legends folder for you. If the app can't find it, browse to your League of Legends folder where `lol.launcher.exe` is saved (`LoLLauncher.exe` or `lol.exe` for Garena installations).


#### How do I make this work on Mac?
Run Championify, the app will try and look for your League of Legends.app for you. If the app can't find it, browse and select your League of Legends.app.


#### Why do I not see the item sets in the launcher?
Due to Riot restrictions, you can only see the item sets in game, you won't see them in the launcher.


#### Why does this not work on XP, Vista, or OSX Lion?
Sorry, Electron doesn't support anything below Windows 7 or Mountain Lion. There's no plans to support it.


#### "App can’t be opened because it is from an unidentified developer"
Read [this](http://osxdaily.com/2012/07/27/app-cant-be-opened-because-it-is-from-an-unidentified-developer/) to fix it.


#### The app opens with a white box, infinite loops, or nothing happens
I'm a bit lost why this is happening on some system, give this a try. Delete the following folders depending on your operating system, and then try Championify again.

__Windows:__ `C:\Users\YOURNAME\AppData\Roaming\Championify`

__OSX:__ `/Users/YOURNAME/Library/Application Support/Championify`


#### AAHHHH! SOMETHING BROKE! IT'S ALL MESSED UP!
Calm down, I gotcha! If something went wrong it means something has changed that I did not expect. Follow the steps [below](#uninstall) in the next FAQ question to remove Championify's builds.


<a name="uninstall" />
#### Nah bro, I don't like this. How can I delete all your builds?
I'm sorry you don't like it, hopefully I'll have it live up to your expectations one day! As for deleting, just hit the "Delete" button in Championify and it'll remove all the items sets generated by Championify.


#### Should I be running this everyday?
Oh no not at all, that's the last thing you want to do. The best time to run Championify is 3-4 day after a major patch comes out. Only got to do it once.


#### Why do you force auto updates of Championify?
If something was to change on Riots end and Championify's item sets broke your client or completely screwed up one of your games, you'd be pretty pissed right? I know I would be. This is just one method to make sure you run in to the least amount of problems possible, plus the updates are under ~8MB anyway.


#### How do I auto update item sets?
It's currently not supported but is planned! If you would like to try a bit of automation yourself you can try the [command line parameters](#clp)


#### Why is my antivirus complaining about lolflavor?
Let me guess, BitDefender? I know, I got it running too. For some reason they have lolflavor marked as malware, which I've checked myself and it's not. To add, Championify never loads a lolflavor page, so even if there was malware laying around Championify would never open it. See [virus total report here](https://www.virustotal.com/en/url/576b112b6ae43a58f00176c5efe8f9456fa16dcfcf4e341e17f6c68c6a5e0e88/analysis/1435015572/). To fix the issue, add "lolflavor.com" to your exceptions in your anti virus. [Tutorial here](http://www.bitdefender.com/support/what-to-do-when-bitdefender-2015-blocks-a-safe-website-or-online-application-1294.html)


#### Why is your script so slow?
Well damn, you must be pretty impatient if you think that's slow... The script is slowed on purpose so users don't spam other peoples servers. They're doing great great stuff over there and the last thing I'd want to do is cause them trouble. However if it's REALLY slow, then you should consider upgrading your dial up connection.


#### Why is the file size so big?
I use Electron to wrap my GUI, and unfortunately it's a bit big. I'd rather the App just work then worry about size.


## Future Plans
Check out the [Features tag in Issues](https://github.com/dustinblackman/Championify/labels/feature) to see all up and  coming ideas.



<a name="clp" />
## Command Line Parameters
Championify supports a few command line parameters for those who would like to automate a few tasks before it's official supported within the app. Params work on both Windows and OSX, and uses the last saved preferences made on the app (preferences are saved each time you hit import).

__Params__

- `--import` Imports item sets
- `--delete` Deletes item sets
- `--autorun` Silently (without loading the UI) imports item sets
- `--close` Closes Championify when finished
- `--startLeague` Starts League of Legends after import

__Example__

Silently imports and starts League afterwards.

```bash
C:/Championify/championify.exe --autorun --startLeague
```


## Bleeding Edge
For the adventurous, bleeding edge builds are available of each branch through CIs. A simpler method will be available once a website is built.

__Windows__

Open [Appveyor](https://ci.appveyor.com/project/dustinblackman/championify/branch/master) and select the the latest master branch commit, then `Platform: x86`, then `artifacts`. You'll find `download.txt` that contains a Zippyshare link to the build off that commit.

__OSX__

Open [Travis](https://travis-ci.org/dustinblackman/Championify/branches) and select the the latest master branch commit, scroll down through the test log until you see `npm run build-artifact`, a few lines down you should see a Zippyshare link to the build off that commit.


<a name="source" />
## Build From Source
You must have Node 4.1.1 and NPM 2.14.4 installed on your system (thats what Electron is using), git clone the repo and run the following in the root folder.

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

## [Donate](https://salt.bountysource.com/teams/championify)

Soon Championify will be expanding, big! With plenty of suggestions and new ideas, Championify will be making it's way to the web and mobile. This will unfortunately have server costs in order to get started and keep running. A couple bucks is more then enough to help! :) [Donate here!](https://salt.bountysource.com/teams/championify)

## Backers

See [BACKERS.md](BACKERS.md)

## Credit
- Icon by [OmerValentine](http://github.com/OmerValentine)
- [Joeldo](https://www.reddit.com/user/joeldo) of [Champion.gg](http://champion.gg)
- [Lolflavor](http://www.lolflavor.com/)


## Thank yous
- [@sargonas](https://github.com/sargonas) and the rest of the Riot API team for unlocking item sets
- All the wonderful people on my [Transifex team](https://www.transifex.com/dustinblackman/championify/) (all 180 of you) for helping translate Championify!


## [License](LICENSE)

Championify isn't endorsed by any of it's content sources or Riot Games and doesn't reflect the views or opinions of them or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.
