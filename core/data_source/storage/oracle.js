'use strict';

const oracledb = require('oracledb');
const _ = require('lodash');
const Events = require('events');
const mysql = require('mysql');


// create table users (id int, name varchar(50))
// insert into users (id, name) values (1, "datav")
// show tables: select * from sys.tables
// show database: select * from sys.databases where owner_sid!=1;
// select db_name();
// =================

function Storage(config){
  var self = this;
  this.config = config;
  this.api = config.name;
}

function queryFormat(query, values) {
  if (!values) return query;
  var sql = query.replace(/\:([a-zA-Z]\w*)/g, function (txt, key) {
    if ( Object.prototype.hasOwnProperty.call(values, key) ) {
      var value = values[key] || null;
      return mysql.escape(value);
    } else {
      return 'NULL'
    }
    return txt;
  }.bind(this));
  return sql;
};

Storage.prototype.query = function (sql, values) {
  var self = this;
  return function(cb){
    if (!sql) {
      return cb('ER_PARSE_ERROR');
    }

    self.conn = new Oracle({
      user: self.config.user,
      password: self.config.password,
      host: self.config.host,
      port: self.config.port,
      database: self.config.database
    });

    self.conn.on('error', cb);
    self.conn.query(queryFormat(sql, values), function (err, rows) {
      cb && cb(err&&"[Oracle Error] " + err, rows);
    });
  }
};

Storage.prototype.end = function(){
  this.conn.close();
};

Storage.prototype.testConnection = function() {
    var self = this;
  return function(cb) {
    var config = self.config;
    var conn = new Oracle({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      database: config.database
    });

    conn.on('error', cb);
    conn.on('connect', function(){
      cb(null, '连接成功');
    });
  }
}

module.exports = Storage

/* =========================================================================== */
/* =========================================================================== */
/* =========================================================================== */
/* =========================================================================== */


let defaultConfig = {
  pool: {
    poolMax: 10,
    poolMin: 0,
    poolTimeout: 3000
  }
};

class Oracle extends Events {
  /**
   * 构造函数
   * @param  {Object} config
   *     - user {String},
   *     - password {String},
   *     - server {String},
   *     - options {Object}
   *     - driver {String} 'tedious', 'tds', 'msnodesql', 'msnodesqlv8
   *     - pool {Object}
   *        - max {Number} 10,
   *        - min {Number} 0,
   *        - idleTimeoutMillis {Number} 30000
   */
  constructor(config) {
    super();
    var self = this
    config = _.merge({}, defaultConfig, config);
    this.pool = null;

    oracledb.createPool({
        user: config.user,
        password: config.password,
        connectString: config.host + ':' + config.port + '/' + config.database
    },function(error, pool){
        if (error) {
         return self.emit('error', err);
        }
        self.pool = pool
        self.clearQueue();
        self.emit('connect');
    })

    this.queue = [];
  }
  query(sql, cb) {
    if (!this.pool) {
      return this.queue.push([sql, cb]);
    }
    try {
      this.pool.getConnection(function(err, conn){
        if(err){
            cb(err)
            return;
        }
        conn.execute(sql, cb)
      })

    } catch(e) {
      // 防止mssql 库报错
      cb(e)
    }
  }
  clearQueue() {
    let queue = this.queue;
    if (!queue.length) {
      return;
    }

    let q = queue.shift();
    this.query(q[0], (err, data) => {
      q[1](err, data);
      this.clearQueue();
    });
  }
  close() {
    this.pool.close()
  }
  /*
  execute(procedureName, param, cb) {

  }
  */
}