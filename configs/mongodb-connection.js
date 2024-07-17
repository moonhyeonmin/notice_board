const { MongoClient } = require("mongodb"); // 몽고디비 연결 주소
const uri =
  "mongodb+srv://moonhyeon062712:1234@cluster0.k2iss1c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

module.exports = function (callback) {
  // 몽고디비 커넥션 연결 함수 반환
  return MongoClient.connect(uri, callback);
};
