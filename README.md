# TAPSWAP BOT

Tap Swap Bot, is Tap game on Telegram.

## BOT FEATURE

- Auto tap
- Auto Use Booster (energy, turbo)
- Auto Complete Daily missions

## Prerequisite

- Git
- Node JS
- TELEGRAM_APP_ID & TELEGRAM_APP_HASH Get it from [Here](https://my.telegram.org/auth?to=apps)
- Tap Swap Account , Create [Here](https://t.me/tapswap_mirror_bot?start=r_5703822759) ,join and claim join reward.

## Setup & Configure BOT

1. clone project repo `git clone https://github.com/Widiskel/tapswap-bot.git` and cd to project dir `cd tapswap-bot`
2. run `npm install`
3. run `cp src/config/config_tmp.js src/config/config.js`
   To configure the app, open `src/config.js` and add your telegram app id and hash there, also this bot using puppeter so you need to add you google chrome executable path
   ```js
  export class Config {
    static TELEGRAM_APP_ID = undefined; // YOUR APP ID
    static TELEGRAM_APP_HASH = undefined; // YOUR APP HASH
    static CHROMEPATH =
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; //PATH TO YOUR EXECUTABLE CHROME OR CHROMIUM
  }
   ```
4. run `mkdir sessions`
5. to start the app run `npm run start`

## Setup Session

1. run bot `npm run start`
2. choose option 1 create session
3. enter session name
4. enter your phone number starting with countrycode ex : `+628xxxxxxxx`
5. after creating sessions, choose 3 start bot, sometimes error happen when run bot afer creating session , just `ctrl+c` twice and `npm run start` again
6. if something wrong with your sessions, reset sessions first, to cancel running bot press `ctrl+c` twice, and start again [from No 1.](#setup-session). Remember reset session will delete all you sessions, you can also delete only the trouble sessions by `rm -rf sessions/YOURTROUBLESESSION` after that start to recreate sessions again

## Note

This bot using telegram sessions. if you ever use one of my bot that use telegram sessions, you can just copy the sessions folder to this bot. Also for the telegram APP ID and Hash you can use it on another bot.

The missions is using my missions enums, that file that contains missions id an answer.
```js
export const MISSIONS = {
  M1016: "5SP670KR66",
  M2012: "infinite",
  M1015: "D5784VHPC377",
  M2013: "parachain",

  getInput: function (value) {
    for (const key in this) {
      if (this.hasOwnProperty(key) && this[key] === value) {
        return key;
      } else {
        return undefined;
      }
    }
    return undefined;
  },
};
```
you can see currently im just have few data about it. you can contribute by forking this repo and add a *Pull Request* to add more missions and answer. How you can know the missions id ?
- Run bot with your sessions
- On run there will be a link you can open, to open tapswap on browser. after you got that link, just stop the bot
- When opening the link you will face a page with ("PLAY ON MOBILE") label. to by pass it follow bellow step
- Download this extension [Request Interceptor](https://chromewebstore.google.com/detail/requestly-intercept-modif/mdnleldcmiljblolnjhpnblkcekpdkpa)
- Import this rule to the **Request Interceptor** [MY RULE](https://app.requestly.io/rules#sharedList/1721199958426-tapswap)
- After that save rule and enable it, and refresh the tapswap tab on your browser.
- Now you can open tapswap on your browser, just do *inspect element* and go to network tab, now you can see all request. just find what your looking for *misisons id* and add the answer and *missions id* to the bot enums/missions.js.

## CONTRIBUTE

Feel free to fork and contribute adding more feature thanks.

## SUPPORT

want to support me for creating another bot ?
**star** my repo or buy me a coffee on

EVM : `0x0fd08d2d42ff086bf8c6d057d02d802bf217559a`

SOLANA : `3tE3Hs7P2wuRyVxyMD7JSf8JTAmEekdNsQWqAnayE1CN`
