# Championify
_Champion-If-Ayyy_

Championify is a little program that downloads all the recent builds from Champion.gg and imports them in to your League of Legends to use within game! No hassle. Windows and OSX are both supported, tested on Windows 8.1 and OSX 10.10.1. Check out some screenshots [here](https://imgur.com/umDkx5j,scpQPBH,ajSXcOB)!

Note this application is still in development, as far as I've tested it's worked great, but don't get overly surprised if you find a bug or two.

This application is inspired by [ebildude123](https://github.com/ebildude123/champion.gg-item-set-creator) item set creator done in PHP.

## FAQ
### Be more descriptive, what does this actually do?
Well it's easy really. Here's a link for [Teemo's most popular build in top lane](http://champion.gg/champion/Teemo) that Champion.gg has tracked. We take this information and save it in a way that League of Legends likes so you can have the exact builds in game!


### Is it safe?
Yep it's safe! Were not modifying League of Legends at all, so no rules broken there. And my code is clean and free to browse, so no smelly virus' or surprises. If you still don't trust my executables, have a tech buddy look over my code themselves and you can build from [source](#source).


### How do I make this work on Windows?
If you have your League of Legends installed in the default folder _(C:\Riot Games\League of Legends)_, then just run Championify and you're good to go. However, if you have it somewhere else, copy Championify to your League of Legends folder and stick it right next to **lol.launcher.exe** and run Championify.


### How do I make this work on Mac?
Run Championify, and a white window will come up (by default). Championify will see if it can find your League client in /Applications. If it can't, drag your League Of Legends.app in to the white window and hit enter! It'll do the rest.

### Wow buddy, what's this black/white box?
Don't worry, that's what it's supposed to look like. I haven't the time to write up an interface for Championify, so it's supposed to look like this.

![Terminal Image](http://i.imgur.com/sA6CyHT.png)


### AAHHHH! SOMETHING BROKE! IT'S ALL MESSED UP!
Calm down, I gotcha! If something went wrong it means something has changed that I did not expect. Follow the steps [below](#uninstall) in the next FAQ question to remove Championify's builds.


<a name="uninstall" />
### Nah bro, I don't like this. How can I delete all your builds?
I'm sorry you don't like it, hopefully I'll have it live up to your expectations one day! As for deleting, first head over to your League of Legends builds directory _C:/Riot Games/League of Legends/Config/Champions/_ for Windows, _/Applications/League of Legends/Contents/LoL/Config/Champions/_ for Mac.

Now you have two options.

Delete all the folders, and be done with it! However you will lose any other builds that other apps might of installed, BUT NOT your Item Sets that you did within the launcher. Those are safe.

**OR**

Go in each folder one by one and delete all files starting with _CGG._


### Should I be running this everyday?
Oh no not at all, that's the last thing you want to do. The best time to run Championify is 3-4 day after a major patch comes out. Only got to do it once.


### If this has been done before, why did you do it again?
Well for a few reasons. [ebildude123](https://github.com/ebildude123/champion.gg-item-set-creator) original script is in PHP, and I wanted to do some changes and I don't like PHP in the slightest. Another issue is that the greater part of the world doesn't have PHP installed by default making the use of his script very difficult, plus you have a good number of people who automatically run in fear when they have to open a command prompt. My solution is a simple .exe/.app where you run and follow the instructions. Much easier.


### Why is your script so slow?
Well damn, you must be pretty impatient if you think that's slow... The script is slowed on purpose so users don't spam Champion.gg's servers. They're doing great great stuff over there and the last thing I'd want to do is cause them trouble. However if it's REALLY slow, then you should consider upgrading your dial up connection.


### My version is outdated and the app wont run?
Yes, I force a version check on run that connects to my package file here on Github. This is to prevent issues if something changes with League or Champion.GG. Wouldn't want you getting in to a game with broken/no builds. You can pickup a new version [here](http://) on the downloads page.


### Why is the file size so big?
EncloseJS modifies a NodeJS binary to include Championify so we have all of Node included, plus some of the modules used are a bit big as well. I rather things just work then worry about size.


### BUT WAIT! I have a suggestion!
Well that's great! Put up an Issue or send me a message on reddit [/u/dustinheroin](https://www.reddit.com/user/dustinheroin) and I'll try to get it when I can. If you can code Coffeescript, feel free to make a pull request. :)

---
## Future Plans
- Replace Terminal Window with a GUI
- Automatically elevate when required instead of making the user do it.
- Verify if local champ builds are the same version as remote.
- Self updater.
- OSX package that doesn't exit until terminal exits.
- Automate generating the resource information for the Windows executable.

---

<a name="source" />
## Build From Source
You must have NodeJS installed on your system, last tested with NodeJS 0.12.2. Git clone the repo and run the following in the root folder.

```console
npm install
npm install -g gulp
npm run build
```

You'll find a compiled executable in the build folder.

---

## Change Log
- 0.0.1: Initial

---

### Credit
- Icon by [fazie69](http://www.iconarchive.com/show/league-of-legends-icons-by-fazie69/Zed-icon.html)
- [ResourceHacker](http://www.angusj.com/resourcehacker/)

---

## [License](LICENSE)

Championify isn't endorsed by Champgion.gg or Riot Games and doesn't reflect the views or opinions of Riot Games, Champgion.gg, or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.
