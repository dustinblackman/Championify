# Contribute

## Code

Pull requests are more then welcome! JSDocs for the majority of functions can be found [here](https://doclets.io/dustinblackman/Championify/master) to get an idea of the structure of the code base. I'm aware that the code base can be a tad confusing, there are decisions made that I wouldn't make today. When the time for a restructing comes, those will be fixed.

__Rules__

- Everything is in ES6 Javascript with the Node 6 presets. That means `const` and `let`, everything for example.
- New features must be discussed in an issue first before a PR, this prevents wasting anyones time incase it's already being worked on.
- Reframe from adding new npm modules if there's already something that'll get the job done. E.g. don't add `lodash` as
  `ramda` is already provided.
- Must pass all tests. `npm test`
- Must write tests for all new functions (look at current tests for examples, still a WIP).
- Functions must be camel cased. `downloadStuff()`
- Variables must be underscored. `my_champion = 'teemo'`
- PR must be off and back to master branch.
- Do not submit translation changes in a pull request, see [translations](#translations) below.

I suggest making sure your linters are setup correctly, or run `npm run lint` every now and again so you're not making a crazy amount of commits.

__Adding a source__

You can find examples for adding sources in [src/sources](src/sources). Each source requires an object export of `source_info`, a function named `getSr()` for summoners rift item sets, and `getVerion()` for the current LoL patch version. Once finished, the app will automatically add the new source to sources list. Make sure to add a nice little 16x16 icon in the [app/img/sources](app/img/sources) folder. For an easy example check out [src/sources/koreanbuilds.js](src/sources/koreanbuilds.js).

## Translations

I use [Transifex](https://www.transifex.com/dustinblackman/championify) to manage all my translations, it's super easy and lets everyone contribute! The initial translations were done with Google Translate, so just because a translation exists doesn't mean it's correct. You can also check out the language status list below to see which have been done by Google, and which has had attention from a native speaker.

__Rules__
- Make sure to check if a translation has been done already before writing it over again.
- If you have an issue with someone elses translation, please use the comments section.
- Don't add extra punctuations (such as `...`) to the end of translations if the English version doesn't have it.

__Setup__
- Create an account with [Transifex](https://www.transifex.com/signin/) (Or login with Github/Google/Facebook/ect)
- Join the Championify team with the language you'd like to work on
- Start!

__Language Status__

| Language | Finished |
| ------------- | -----:|
| English | Yes |
| Arabic | Yes |
| Bosnian | Yes |
| Bulgarian | Yes |
| Catalan | Yes |
| Croatian | No |
| Chinese Simplified | Yes |
| Chinese Traditional | Yes |
| Danish | Yes |
| Dutch | Yes |
| Finnish | Yes |
| French | Yes |
| German | Yes |
| Georgian | No |
| Greek | Yes |
| Hebrew | Yes |
| Hindi | No |
| Hungarian | Yes |
| Indonesian | Yes |
| Italian | Yes |
| Japanese | Yes |
| Khmer | No |
| Korean | Yes |
| Latvian | Yes |
| Lithuanian | Yes |
| Malay | Yes |
| Norwegian | Yes |
| Polish | Yes |
| Portuguese | Yes |
| Portuguese Brazil | Yes |
| Romanian | Yes |
| Russian | Yes |
| Serbian | Yes |
| Slovak | No |
| Slovenian | Yes |
| Spanish | Yes |
| Swedish | Yes |
| Thai | Yes |
| Turkish | Yes |
| Vietnamese | Yes |

Please prevent from putting translations in PRs, I'd rather keep those for code. I try to check Transifex every other day, but if you'd like me to get a look at your translations quickly then hit me up on [Gitter](https://gitter.im/dustinblackman/Championify).
