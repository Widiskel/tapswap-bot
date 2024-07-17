import { Config } from "./src/config/config.js";
import { TapSwap } from "./src/core/tap_swap.js";
import { Telegram } from "./src/core/telegram.js";
import { MISSIONS } from "./src/enums/missions.js";
import { Helper } from "./src/utils/helper.js";
import logger from "./src/utils/logger.js";
import twist from "./src/utils/twist.js";

async function operation(user, query, url) {
  const tapswap = new TapSwap(user, query, url);

  twist.log(`Connecting to Tapswap`, user, tapswap);
  await tapswap.initAndLogin();
  await Helper.sleep(2000, user, `Connected to Tap Swap`, tapswap);

  while (
    tapswap.player.charge_level != 5 &&
    (await tapswap.upgrade("charge")) == true
  ) {}
  while (
    tapswap.player.energy_level != 20 &&
    (await tapswap.upgrade("energy")) == true
  ) {}
  while (
    tapswap.player.tap_level != 20 &&
    (await tapswap.upgrade("tap")) == true
  ) {}

  const tap = Math.floor(tapswap.player.energy / tapswap.player.tap_level);
  await tapswap.submitTap(tap);
  while ((await tapswap.applyBoost("energy")) == true) {
    const tap = Math.floor(tapswap.player.energy / tapswap.player.tap_level);
    await tapswap.submitTap(tap);
  }
  while ((await tapswap.applyBoost("turbo")) == true) {
    await Helper.sleep(
      15000,
      user,
      `Delaying for 15 Second before submitting tap with booster`,
      tapswap
    );
    const tap = Math.floor(Helper.random(400, 800));
    await tapswap.submitTap(tap);
    await Helper.sleep(
      5000,
      user,
      `Tap with booster submitted, delaying for 5 Second until boost end`,
      tapswap
    );
  }

  const onGoingMission = [];
  for (const missions of tapswap.config.missions) {
    if (
      !tapswap.account.missions.completed.includes(missions.id) &&
      !tapswap.account.missions.active.includes(missions.id)
    ) {
      await tapswap.joinMissions(missions.id);
      await tapswap.finishMissionsItem(missions.id);
      onGoingMission.push(missions.id);
    }
  }

  if (onGoingMission.length != 0) {
    await Helper.sleep(
      60000 * 6,
      user,
      `Delaying for 6 Min before completing missions`,
      tapswap
    );

    for (const missions of tapswap.account.missions.active) {
      const miss = tapswap.config.missions.filter(
        (item) => item.id == missions.id
      );

      if (miss.length != 0) {
        if (miss[0].items[0].require_answer == true) {
          const missionInput = MISSIONS[missions.id];
          if (missionInput != undefined) {
            await tapswap.finishMissionsItemWithInput(
              missions.id,
              missionInput
            );
          }
        }
        await tapswap.finishMissions(missions.id);
        await tapswap.claimMission(missions.id);
      }
    }
  }

  await tapswap.browser.close();
  await Helper.sleep(
    60000 * 10,
    user,
    `Account ${user.firstName + " " + user.lastName}(${
      user.id
    }) Processing Complete, Delaying for 10 Minutes`,
    tapswap
  );
  await operation(user, query, url);
}

let init = false;
async function startBot() {
  return new Promise(async (resolve, reject) => {
    try {
      logger.info(`BOT STARTED`);
      if (
        Config.TELEGRAM_APP_ID == undefined ||
        Config.TELEGRAM_APP_HASH == undefined
      ) {
        throw new Error(
          "Please configure your TELEGRAM_APP_ID and TELEGRAM_APP_HASH first"
        );
      }
      const tele = await new Telegram();
      if (init == false) {
        await tele.init();
        init = true;
      }

      const sessionList = Helper.getSession("sessions");
      const paramList = [];
      for (const acc of sessionList) {
        await tele.useSession("sessions/" + acc);
        tele.session = acc;
        const user = await tele.client.getMe();
        const [query, url] = await tele
          .resolvePeer()
          .then(async () => {
            return await tele.initWebView();
          })
          .catch((err) => {
            throw err;
          });

        await tele.disconnect();
        paramList.push([user, query, url]);
      }

      const promiseList = paramList.map(async (data) => {
        await operation(data[0], data[1], data[2]);
      });

      await Promise.all(promiseList);
      twist.clear();
      resolve();
      logger.info(`BOT FINISHED`);
    } catch (error) {
      logger.info(`BOT STOPPED`);
      logger.error(JSON.stringify(error));
      reject(error);
    }
  });
}

(async () => {
  try {
    logger.clear();
    logger.info("");
    logger.info("Application Started");
    console.log("TAPSWAP BOT");
    console.log("By : Widiskel");
    console.log("Dont forget to run git pull to keep up to date");
    await startBot();
  } catch (error) {
    console.log("Error During executing bot", error);
  }
})();
