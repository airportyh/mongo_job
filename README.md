mongo_job
=========

A simple job queue implementation based on MongoDB's capped collections.

## Install

```
npm install mongo_job
```

## Usage

Assuming `jobs` is a capped collection, created using the `createCollection` method - for example you can do in the mongo console (this creates a 5M capped collection)

```js
> db.createCollection('jobs', {capped: true, size: 5242880})
```

Now, to create a worker:

```js
var mongoJob = require('mongo_job')
var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://127.0.0.1:27017/example'

MongoClient.connect(url, function(err, db){
  var jobs = db.collection('jobs')
  var worker = 
    mongoJob.runJobs(
      jobs, 
      function(details, callback){
        console.log('Starting job', details)
        // Our "example job" does nothing but
        // wait for 2 seconds, but yours will
        // do interesting things
        setTimeout(function(){
          console.log('Finished job', details)
          callback()
        }, 2000)
      }
    )
})
```

The worker will use MongoDB's tailable cursor to listen to any available new jobs, and work them when they are created.

### Dispatching A Job

Dispatching a job is also simple:

```js
var jobs = db.collection('jobs')
mongoJob.dispatch(jobs, {
  name: 'my first job' // this job details can contain any info
                       // and will be fed back to the
                       // callback of `runJobs`
}, function(err){
  if (err) console.error(err.message)
  else console.log('ok')
})
```