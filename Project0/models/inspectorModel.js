/**
 * Simulates a healthInspector record
 */
class Inspector {
  /**
       * Constructor for Restaurant object
       * @param {number} idNum primary key
       * @param {string} username for logging in
       * @param {string} password for logging in
       */
  constructor(idNum, username, password) {
    this.idNum = idNum;
    this.username = username;
    this.password = password;
  }
}

module.exports = Inspector;
