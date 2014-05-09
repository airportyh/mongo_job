var cmdLn = require('cmd-ln')
var db = require('./db')
var mongoJob = require('./index')
var async = require('async')

cmdLn(function(number){

  number = Number(number)
  db(function(err, db){
    if (err) return console.error(err.message)

    var jobs = db.collection('jobs')
    async.eachLimit(Array(number), 10,
      function(n, next){
        mongoJob.dispatch(jobs, 'foo', function(err){
          if (err) return next(err)
          console.log('Dispatched')
          next()
        })
      },
      function(err){
        if (err) console.error(err.message)
        else console.log('ok')
        db.close()
      }
    )
  })
  
})