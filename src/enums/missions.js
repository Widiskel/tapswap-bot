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
