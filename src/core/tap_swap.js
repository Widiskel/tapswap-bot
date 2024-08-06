import { SecureUtil } from "../utils/secure_util.js";
import { Helper } from "../utils/helper.js";
import twist from "../utils/twist.js";
import logger from "../utils/logger.js";
import puppeteer from "puppeteer";

export class TapSwap {
  constructor(acc, query, url) {
    this.acc = acc;
    this.query = query;
    this.launchUrl = url;
    this.ua = Helper.randomUserAgent();
    this.maxRetry = 3;
    this.currentRetry = 0;

    var Mn = Object.defineProperty;
    var Ln = (R, $, W) =>
      $ in R
        ? Mn(R, $, {
            enumerable: !0,
            configurable: !0,
            writable: !0,
            value: W,
          })
        : (R[$] = W);
    var Le = (R, $, W) => (Ln(R, typeof $ != "symbol" ? $ + "" : $, W), W);
    Le(SecureUtil, "readableChars", "ABCDEFGHJKLMNPQRSTUVWXYZ23456789");
    Le(
      SecureUtil,
      "defaultChars",
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    );
  }

  hs($, W) {
    return ($ * W) % $;
  }

  async generateHeader() {
    const userId = this.player.id;
    const timestamp = Date.now();
    const contentId = Math.floor(this.hs(userId, timestamp));

    const header = {
      Authorization: `Bearer ${this.access_token}`,
      "Content-type": "application/json",
      "Cache-Id": SecureUtil.makeRandomString(8),
      "Content-Id": contentId.toString(),
      ...this.headers,
    };
    await this.page.setExtraHTTPHeaders(header);
    return timestamp;
  }

  async initAndLogin() {
    logger.info(`Try to login using puppeter`);
    this.browser = await puppeteer.launch({
      args: ["--no-sandbox"],
    });
    this.page = await this.browser.newPage();
    this.apiUrl = "https://api.tapswap.club";

    await this.page.setRequestInterception(true);

    this.headers = {
      "User-Agent": this.ua,
      "Sec-Ch-Ua": this.ua,
      "Cache-Control": "no-cache",
      "Sec-Ch-Ua-Mobile": "?1",
      "Sec-Ch-Ua-Platform": "android",
      "x-app": "tapswap_server",
      "x-touch": "1",
    };
    // console.log(headers);
    await this.page.setExtraHTTPHeaders(this.headers);

    this.page.on("request", async (request) => {
      if (request.url().includes(this.apiUrl + "/api/")) {
        if (
          request.url().includes("login") &&
          request.headers()["x-cv"] != undefined
        ) {
          this.xCv = request.headers()["x-cv"];
          this.headers = {
            "x-cv": this.xCv,
            ...this.headers,
          };
          await this.page.setExtraHTTPHeaders(this.headers);
        }
        const reqData = {
          type: "REQUEST",
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData(),
        };
        // console.log(reqData);
        logger.info(`Send Request`);
        logger.info(`Request : ${reqData.method} - ${reqData.url}`);
        logger.info(`Request Header : ${JSON.stringify(reqData.headers)}`);
        logger.info(`Request Body : ${JSON.stringify(reqData.postData)}`);
      }
      request.continue();
    });

    this.page.on("response", async (response) => {
      if (response.url().includes(this.apiUrl + "/api/")) {
        let responseBody;
        const contentType = response.headers()["content-type"];
        if (contentType && contentType.includes("application/json")) {
          responseBody = await response.json();
          if (responseBody.access_token) {
            this.access_token = responseBody.access_token;
            this.player = responseBody.player;
            this.account = responseBody.account;
            this.config = responseBody.conf;
          }
        }
        const resData = {
          type: "RESPONSE",
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          responseData: responseBody,
        };
        // console.log(resData);
        logger.info(`Received Response`);
        logger.info(`Response : ${resData.url}`);
        logger.info(`Response Header : ${JSON.stringify(resData.headers)}`);
        logger.info(
          `Response Body : ${resData.status} - ${JSON.stringify(
            resData.responseData
          )}`
        );
      }
    });

    await this.page.goto(this.launchUrl, { waitUntil: "networkidle0" });
    logger.info("launching");
    // await this.browser.close();
  }

  async submitTap(totalTap) {
    twist.log(`Tapping for ${totalTap} Times`, this.acc, this);

    const requestBody = {
      taps: totalTap,
      time: await this.generateHeader(),
    };
    const response = await this.page.evaluate(
      async (url, requestBody) => {
        const res = await fetch(url, {
          method: "POST",
          body: JSON.stringify(requestBody),
        });
        const json = await res.json().catch(() => ({}));

        return {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          data: json,
        };
      },
      this.apiUrl + "/api/player/submit_taps",
      requestBody
    );

    if (response.ok) {
      const data = response.data;
      this.player = data.player;
      await Helper.sleep(3000, this.acc, `Tap Submitted`, this);
    } else if (response.status == 400) {
      await Helper.sleep(
        1000,
        this.acc,
        `Submit Tap Failed - ${response.data.message}`,
        this
      );
    } else {
      await Helper.sleep(
        3000,
        this.acc,
        `Error During Submit Tap : ${response.status} - ${response.statusText}`,
        this
      );
      await this.handleError("submitTap", totalTap);
    }
  }

  async handleError(context, param) {
    logger.info(
      `Handling error ${context} (${this.currentRetry}/${this.maxRetry}) `
    );
    if (this.currentRetry != this.maxRetry) {
      this.currentRetry += 1;
      await Helper.sleep(3000, this.acc, `Retrying after 3 Second ...`, this);
      if (context == "submitTap") {
        await this.submitTap(param);
      } else if (context == "joinMissions") {
        await this.joinMissions(param);
      } else if (context == "finishMissionsItem") {
        await this.finishMissionsItem(param);
      } else if (context == "finishMissionsItemWithInput") {
        await this.finishMissionsItemWithInput(param[0], param[1]);
      } else if (context == "finishMissions") {
        await this.finishMissions(param);
      } else if (context == "claimMission") {
        await this.claimMission(param);
      } else if (context == "upgrade") {
        await this.upgrade(param);
      } else if (context == "applyBoost") {
        await this.applyBoost(param);
      }
    } else {
      await Helper.sleep(3000, this.acc, `Max Error Retry Reached...`, this);
      this.currentRetry = 0;
    }
  }

  async joinMissions(missionId) {
    twist.log(`Joining Mission with id : ${missionId}`, this.acc, this);
    this.generateHeader();
    const requestBody = {
      id: missionId,
    };

    const response = await this.page.evaluate(
      async (url, requestBody) => {
        const res = await fetch(url, {
          method: "POST",
          body: JSON.stringify(requestBody),
        });
        const json = await res.json().catch(() => ({}));

        return {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          data: json,
        };
      },
      this.apiUrl + "/api/missions/join_mission",
      requestBody
    );
    if (response.ok) {
      const data = response.data;
      this.account = data.account;
      await Helper.sleep(
        1000,
        this.acc,
        `Missions ${missionId} joined successfully`,
        this
      );
    } else if (response.status == 400) {
      await Helper.sleep(
        1000,
        this.acc,
        `Missions ${missionId} - ${response.data.message}`,
        this
      );
    } else {
      await Helper.sleep(
        3000,
        this.acc,
        `Error During Join Mission : ${response.status} - ${response.statusText}`,
        this
      );
      await this.handleError("joinMissions", totalTap);
    }
  }
  async finishMissionsItem(missionId) {
    twist.log(`Finisihing Mission Item with id : ${missionId}`, this.acc, this);
    const requestBody = {
      id: missionId,
      itemIndex: 0,
    };

    const response = await this.page.evaluate(
      async (url, requestBody) => {
        const res = await fetch(url, {
          method: "POST",
          body: JSON.stringify(requestBody),
        });
        const json = await res.json().catch(() => ({}));

        return {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          data: json,
        };
      },
      this.apiUrl + "/api/missions/finish_mission_item",
      requestBody
    );

    // console.log(response);

    if (response.ok) {
      const data = response.data;
      this.account = data.account;
      await Helper.sleep(
        1000,
        this.acc,
        `Missions Item ${missionId} Finished Successfully`,
        this
      );
    } else if (response.status == 400) {
      await Helper.sleep(
        1000,
        this.acc,
        `Missions ${missionId} - ${response.data.message}`,
        this
      );
    } else {
      await Helper.sleep(
        3000,
        this.acc,
        `Error : ${response.status} - ${response.statusText}`,
        this
      );
      await this.handleError("finishMissionsItem", missionId);
    }
  }

  async finishMissionsItemWithInput(missionId, code = "") {
    twist.log(
      `Finisihing Mission Item with id : ${missionId} , with code : ${code}`,
      this.acc,
      this
    );
    const requestBody = {
      id: missionId,
      itemIndex: 0,
      user_input: code,
    };

    const response = await this.page.evaluate(
      async (url, requestBody) => {
        const res = await fetch(url, {
          method: "POST",
          body: JSON.stringify(requestBody),
        });
        const json = await res.json().catch(() => ({}));

        return {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          data: json,
        };
      },
      this.apiUrl + "/api/missions/finish_mission_item",
      requestBody
    );

    // console.log(response);

    if (response.ok) {
      const data = response.data;
      this.account = data.account;
      await Helper.sleep(
        1000,
        this.acc,
        `Missions Item ${missionId} Finished Successfully`,
        this
      );
    } else if (response.status == 400) {
      await Helper.sleep(
        1000,
        this.acc,
        `Missions ${missionId} - ${response.data.message}`,
        this
      );
    } else {
      await Helper.sleep(
        3000,
        this.acc,
        `Error : ${response.status} - ${response.statusText}`,
        this
      );
      await this.handleError("finishMissionsItemWithInput", [missionId, code]);
    }
  }

  async finishMissions(missionId) {
    twist.log(`Finisihing Mission with id : ${missionId}`, this.acc, this);
    const requestBody = {
      id: missionId,
    };

    const response = await this.page.evaluate(
      async (url, requestBody) => {
        const res = await fetch(url, {
          method: "POST",
          body: JSON.stringify(requestBody),
        });
        const json = await res.json().catch(() => ({}));

        return {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          data: json,
        };
      },
      this.apiUrl + "/api/missions/finish_mission",
      requestBody
    );

    if (response.ok) {
      const data = response.data;
      this.account = data.account;
      this.player = data.player;
      await Helper.sleep(
        1000,
        this.acc,
        `Missions ${missionId} Finished Successfully`,
        this
      );
    } else if (response.status == 400) {
      await Helper.sleep(
        1000,
        this.acc,
        `Missions Item ${missionId} Failed to Finish - ${response.data.message}`,
        this
      );
    } else {
      await Helper.sleep(
        3000,
        this.acc,
        `Error : ${response.status} - ${response.statusText}`,
        this
      );
      await this.handleError("finishMissions", missionId);
    }
  }
  async claimMission(missionId) {
    await this.generateHeader();
    twist.log(`Claiming Mission with id : ${missionId}`, this.acc, this);
    const requestBody = {
      task_id: missionId,
    };

    const response = await this.page.evaluate(
      async (url, requestBody) => {
        const res = await fetch(url, {
          method: "POST",
          body: JSON.stringify(requestBody),
        });
        const json = await res.json().catch(() => ({}));

        return {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          data: json,
        };
      },
      this.apiUrl + "/api/player/claim_reward",
      requestBody
    );

    if (response.ok) {
      const data = response.data;
      this.player = data.player;
      await Helper.sleep(
        1000,
        this.acc,
        `Missions ${missionId} Claimed Successfully`,
        this
      );
    } else {
      await Helper.sleep(
        3000,
        this.acc,
        `Error : ${response.status} - ${response.statusText}`,
        this
      );
      await this.handleError("claimMission", missionId);
    }
  }
  async upgrade(type) {
    await this.generateHeader();
    twist.log(`Upgrading ${type} level`, this.acc, this);
    const requestBody = {
      type: type,
    };

    const response = await this.page.evaluate(
      async (url, requestBody) => {
        const res = await fetch(url, {
          method: "POST",
          body: JSON.stringify(requestBody),
        });
        const json = await res.json().catch(() => ({}));

        return {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          data: json,
        };
      },
      this.apiUrl + "/api/player/upgrade",
      requestBody
    );

    if (response.ok) {
      const data = response.data;
      this.player = data.player;
      await Helper.sleep(
        1000,
        this.acc,
        `${type} Level Upgraded Successfully`,
        this
      );
      return true;
    } else if (response.status == 400) {
      await Helper.sleep(
        1000,
        this.acc,
        `${type} Level Upgrade Failed - ${response.data.message}`,
        this
      );
      return false;
    } else {
      await Helper.sleep(
        3000,
        this.acc,
        `Error : ${response.status} - ${response.statusText}`,
        this
      );
      await this.handleError("upgrade", type);
      return false;
    }
  }
  async applyBoost(type) {
    await this.generateHeader();
    twist.log(`Applying boost ${type}`, this.acc, this);
    const requestBody = {
      type: type,
    };

    const response = await this.page.evaluate(
      async (url, requestBody) => {
        const res = await fetch(url, {
          method: "POST",
          body: JSON.stringify(requestBody),
        });
        const json = await res.json().catch(() => ({}));

        return {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          data: json,
        };
      },
      this.apiUrl + "/api/player/apply_boost",
      requestBody
    );

    if (response.ok) {
      const data = response.data;
      this.player = data.player;
      await Helper.sleep(
        1000,
        this.acc,
        `${type} Boost Activated Successfully`,
        this
      );
      return true;
    } else if (response.status == 400) {
      await Helper.sleep(
        1000,
        this.acc,
        `Failed to Activate ${type} Boost - ${response.data.message}`,
        this
      );
      return false;
    } else {
      await Helper.sleep(
        3000,
        this.acc,
        `Error : ${response.status} - ${response.statusText}`,
        this
      );
      await this.handleError("applyBoost", type);
      return false;
    }
  }
}
