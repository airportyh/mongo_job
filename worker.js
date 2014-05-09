var cmdLn = require('cmd-ln')
var db = require('./db')
var mongoJob = require('./index')

cmdLn(function(concurrency){
  concurrency = Number(concurrency)
  db(function(err, db){
    if (err) return console.error(err.message)

    var jobs = db.collection('jobs')
    for (var i = 0; i < concurrency; i++){
      newWorker(i, jobs)
    }
  })
})

function newWorker(i, jobs){
  mongoJob.runJobs(
    jobs,
    function(details, callback){
      console.log('Worker', i, 'Starting job', details)
      setTimeout(function(){
        console.log('Worker', i, 'Finished job', details)
        callback()
      }, 2000)
    }
  )
}