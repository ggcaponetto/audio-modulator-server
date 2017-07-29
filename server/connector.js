function Connector(name) {
  this.name = name;
  this.pairs = [];
  this.browserRequests = [];
  this.phoneRequests = [];
  // Pair functions
  this.clearPairs = () => {
    this.pairs = [];
  };
  this.addPair = (id, timestamp) => {
    this.pairs.push({ id, timestamp });
  };
  this.removePair = (id) => {
    this.pairs.forEach((entry, i) => {
      if (entry.id === id) {
        this.pairs.splice(i, 1);
      }
    });
  };
  this.getPairs = () => this.pairs;

  // Browser request functions
  this.clearBrowserRequests = () => {
    this.browserRequests = [];
  };
  this.addBrowserRequest = (id, timestamp) => {
    this.browserRequests.push({ id, timestamp });
  };
  this.removeBrowserRequest = (id) => {
    this.browserRequests.forEach((entry, i) => {
      if (entry.id === id) {
        this.browserRequests.splice(i, 1);
      }
    });
  };
  this.getBrowserRequests = () => this.browserRequests;
}

module.exports = {
  Connector
};
