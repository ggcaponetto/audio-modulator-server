function Pool(name) {
  this.name = name;
  this.pool = [];
  this.clear = () => {
    this.pool = [];
  };
  this.add = (id, timestamp) => {
    this.pool.push({ id, timestamp });
  };
  this.remove = (id) => {
    this.pool.forEach((entry, i) => {
      if (entry.id === id) {
        this.pool.splice(i, 1);
      }
    });
  };
  this.getPool = () => this.pool;
}

module.exports = {
  Pool
};
