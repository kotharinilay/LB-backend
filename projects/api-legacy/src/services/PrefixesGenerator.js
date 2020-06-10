function generate(values) {
  const valuesSet = new Set();

  values.forEach((value) => {
    const lowercased = value.trim().toLowerCase();
    if (lowercased.length < 2) {
      return;
    }

    for (let i = 2; i <= lowercased.length; i++) {
      const value = lowercased.substr(0, i);
      valuesSet.add(value);
    }
  });

  return Array.from(valuesSet).sort();
}


module.exports = {
  generate: generate
};
