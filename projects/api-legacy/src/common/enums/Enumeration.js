class Enumeration {
  constructor(obj) {
    for (const key in obj) {
      this[key] = obj[key];
    }
    return Object.freeze(this);
  }

  hasKey(key) {
    return this.hasOwnProperty(key);
  }

  hasValue(value) {
    for (const item in this) {
      if (this[item] === value) {
        return true;
      }
    }

    return false;
  }
}

module.exports = Enumeration;
