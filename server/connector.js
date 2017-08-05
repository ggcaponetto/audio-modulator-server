function Connector(name) {
  this.name = name;
  this.pairs = [];
  // Pair functions
  this.clearPairs = () => {
    this.pairs = [];
  };
  this.addPair = (obj) => {
    const id = this.pairs.length === 0 ? 1 : this.pairs[this.pairs.length - 1].id + 1;
    this.pairs.push(Object.assign(obj, { id, isPaired: false }));
    return id; // returns the inserted pair id
  };
  this.markPaired = (id) => {
    console.log(`Marking pair with id ${id} as paired.`);
    const self = this;
    this.pairs.forEach((pair, i) => {
      console.log(`Checking pair with id ${pair.id} needs to be paired`);
      if (pair.id === id) {
        console.log(`Checking pair with id ${pair.id} needs to be paired: id match found.`);
        self.pairs[i].isPaired = true;
      }
    });
  };
  this.markUnpaired = (id) => {
    this.pairs.forEach((pair, i) => {
      if (pair.id === id) {
        this.pairs[i].isPaired = false;
      }
    });
  };
  this.removePair = (id) => {
    this.pairs.forEach((pair, i) => {
      if (pair.id === id) {
        this.pairs.splice(i, 1);
      }
    });
  };
  this.getPairs = () => this.pairs;
  this.replacePairs = (newPairs) => {
    this.pairs = newPairs;
  };
}

module.exports = {
  Connector
};
