

export default function Logger(name, config){
  this.name = name;
  this.config = config;
  this.log = (msg, obj) => {
    if(this.config && this.config.isConsoleLogEnabled){
      console.log(msg, obj);
    }
  };
};
