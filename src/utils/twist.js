import { Twisters } from "twisters";
import { Helper } from "./helper.js";
import logger from "./logger.js";
import { TapSwap } from "../core/tap_swap.js";

class Twist {
  constructor() {
    /** @type  {Twisters}*/
    this.twisters = new Twisters();
  }

  /**
   * @param {string} acc
   * @param {TapSwap} core
   * @param {string} msg
   * @param {string} delay
   */
  log(msg = "", acc = "", core = new TapSwap(), delay) {
    if (delay == undefined) {
      logger.info(`${acc.id} - ${msg}`);
      delay = "-";
    }
    const player = core.player ?? {};
    const energy = player.energy ?? "-";
    const league = player.ligue ?? "-";
    const tapLevel = player.tap_level ?? "-";
    const energyLevel = player.energy_level ?? "-";
    const chargeLevel = player.charge_level ?? "-";
    const balance = player.shares ?? 0;
    const boost = player.boost ?? [];
    const energyBoost = boost.filter((item) => item.type == "energy");
    const turboBoost = boost.filter((item) => item.type == "turbo");
    const energyRefill = energyBoost.length > 0 ? energyBoost[0].cnt : 0;
    const turboRefill = turboBoost.length > 0 ? turboBoost[0].cnt : 0;
    const missions = core.account ? core.account.missions : {};
    const activeMissions = missions.active ? missions.active.length : 0;
    const completedMissions = missions.completed
      ? missions.completed.length
      : 0;
    const conf = core.config ?? {};
    const missionList = conf.missions ?? [];
    const totalMissions = missionList.length ?? 0;

    this.twisters.put(acc.id, {
      text: `
================= Account ${acc.id} =============
Name               : ${acc.firstName} ${acc.lastName}
Energy             : ${energy}
League             : ${league}
Tap Level          : ${tapLevel}
Energy Level       : ${energyLevel}
Charge Level       : ${chargeLevel}
Balance            : +- ${balance}

Energy Refill      : ${energyRefill}
Turbo Refill       : ${turboRefill}

Active Missions    : ${activeMissions}
Completed Missions : ${completedMissions}
Total Missions     : ${totalMissions}

Status : ${msg}
Delay : ${delay}
==============================================`,
    });
  }

  clear() {
    this.twisters.flush();
  }
}
export default new Twist();
