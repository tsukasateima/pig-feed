var mysql = require("mysql");
var pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "478489464",
  database: "pig_feed",
});
/**
 * @param  sql [sql语句] 传入参数
 * @param  values [值，非必填] 传入参数
 * @return Promise [结果] 返回值
 */
let query = (sql, values) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        connection.query(sql, values, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
        connection.release();
      }
    });
  });
};

module.exports = query;
