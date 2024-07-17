export class SecureUtil {
  static makeRandomString($, W = this.defaultChars) {
    let U = "";
    const V = W.length;
    for (let K = 0; K < $; K++) U += W.charAt(Math.floor(Math.random() * V));
    return U;
  }
}
