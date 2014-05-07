var cmdLn = require('cmd-ln')
var db = require('./db')
var mongoJob = require('./index')

cmdLn(function(description){

  db(function(err, db){
    if (err) return console.error(err.message)

    var jobs = db.collection('jobs')
    mongoJob.dispatch(jobs, description, function(err){
      if (err) console.error(err.message)
      db.close()
    })
  })
  
})