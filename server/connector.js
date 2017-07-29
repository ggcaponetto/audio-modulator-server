function Connector(name) {
  this.name = name;
  this.pairs = [];
  this.browserRequests = [];
  this.phoneRequests = [];
  // Pair functions
  this.clearPairs = () => {
    this.pairs = [];
  };
  this.addPair = (obj) => {
    this.pairs.push(obj);
  };
  this.removePair = (browserRequestId) => {
    this.pairs.forEach((entry, i) => {
      if (entry.browserRequestId === browserRequestId) {
        this.pairs.splice(i, 1);
      }
    });
  };
  this.getPairs = () => this.pairs;
  this.replacePairs = (newPairs) => {
    this.pairs = newPairs;
  };
  // Browser request functions
  this.clearBrowserRequests = () => {
    this.browserRequests = [];
  };
  this.addBrowserRequest = () => {
    const id = this.browserRequests.length === 0 ?
    0 :
    this.browserRequests[this.browserRequests.length - 1].id + 1;

    this.browserRequests.push({ id, timestamp: Date.now() });
    return id;
  };
  this.removeBrowserRequest = (id) => {
    this.browserRequests.forEach((entry, i) => {
      if (entry.id === id) {
        this.browserRequests.splice(i, 1);
      }
    });
  };
  this.getBrowserRequests = () => this.browserRequests;
  this.toString = () => {
    const simplePairs = [];
    this.pairs.forEach((p) => {
      const pair = p;
      pair.ws = null;
      simplePairs.push(p);
    });
    return JSON.stringify({
      name: this.name,
      pairs: simplePairs,
      browserRequests: this.browserRequests
    }, null, 4);
  };
}

module.exports = {
  Connector
};
