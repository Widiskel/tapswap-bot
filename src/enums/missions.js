export const MISSIONS = {
  M2012: "infinite",
  M2013: "parachain",
  M2014: "instamine",
  M2015: "WebSocket",
  M1015: "D5784VHPC377",
  M1016: "5SP670KR66",
  M1017: "D772WQ9Z5",
  M1018: "7N008TQ31V",
  M1019: "0TJN63R97A",

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
