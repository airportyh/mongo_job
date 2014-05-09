var assert = require('assert')
var is = require('is-type')
var debug = require('debug')
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
  this.id = Math.floor(Math.random() * 1000)
  this.debug = debug('mongo_job.' + this.id)
  this.jobs = jobs
  this.processJob = processJob
  this.jobCount = 0
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
    cursor.rewind()
    cursor.nextObject(function(err, job){
      if (err){
        self.emit('error', err)
        return
      }
      if (job == null){
        assert(false, 'cursor shouldnt return null job')
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
    this.jobs.findAndModify(
      {state: 'new:'}, 
      [['_id', 'descending']], 
      {$set: {state: 'open'}},
      function(err, job){
        if (job == null){
          self.debug('Didnt get the job')
          return callback(new Error('Didnt get the job'))
        }
        self.debug('Got the job!')
        callback(null, job)
      })
  },
  runJob: function(job, callback){
    var self = this
    self.debug('Running the job')
    this.processJob(job.details, function(){
      self.jobCount++
      self.debug('Done the job', self.jobCount)
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
