var cmdLn = require('cmd-ln')
var db = require('./db')
var mongoJob = require('./index')

cmdLn(function(concurrency){
  concurrency = Number(concurrency)
  db(function(err, db){
    if (err) return console.error(err.message)

    var jobs = db.collection('jobs')
    for (var i = 0; i < concurrency; i++){
      newWorker(jobs)
    }
     
  })
})

function newWorker(jobs){
  mongoJob.runJobs(
    jobs,
    function(details, callback){
      console.log('Starting job', details)
      setTimeout(function(){
        console.log('Finished job', details)
        callback()
      }, 2000)
    }
  )
}