var assert = require('assert')
var is = require('is-type')
var debug = require('debug')('mongo-job')
var EventEmitter = require('events').EventEmitter

exports.dispatch = dispatchJob
function dispatchJob(jobs, details, callback){
  var job = {
    details: details,
    state: 'new:'
  }
  jobs.insert(job, callback)
}

function Worker(jobs, processJob){
  this.jobs = jobs
  this.processJob = processJob
}

Worker.prototype = {
  __proto__: EventEmitter.prototype,
  start: function(){
    var self = this
    this.jobs.find(
      {state: 'new:'}, 
      {tailable: true},
      function(err, cursor){
        if (err){
          self.emit('error', err)
          return
        }
        self.takeNextJob(cursor)
      }
    )
  },
  takeNextJob: function(cursor){
    var self = this
    cursor.nextObject(function(err, job){
      if (err){
        self.emit('error', err)
        return
      }
      if (job == null){
        return
      }
      self.claimJob(job, function(err, job){
        if (err){
          self.takeNextJob(cursor)
          return
        }
        self.runJob(job, function(err){
          if (err){
            self.emit('error', err)
          }
          self.takeNextJob(cursor)
        })
      })
    })
  },
  claimJob: function(job, callback){
    var self = this
    job.state = 'open'
    this.jobs.findAndModify(
      {_id: job._id, state: 'new:'}, 
      [['_id', 'descending']], 
      job,
      function(err, job){
        if (job == null){
          debug('Didnt get the job')
          return callback(new Error('Didnt get the job'))
        }
        debug('Got the job')
        callback(null, job)
      })
  },
  runJob: function(job, callback){
    var self = this
    debug('Running the job')
    this.processJob(job.details, function(){
      debug('Done the job')
      job.state = 'done'
      self.jobs.save(job, callback)
    })
  }
}

exports.runJobs = runJobs
function runJobs(jobs, processJob){
  var worker = new Worker(jobs, processJob)
  worker.start()
  return worker
}
