var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://127.0.0.1:27017/mongo_job_queue'

module.exports = function(callback){
  MongoClient.connect(url, callback)
}