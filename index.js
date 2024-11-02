const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
mongoose.connect(process.env.MONGO_URI)
const Schema = mongoose.Schema

const userSchema = new Schema({
  username: { type: String, required: true}
})

const exerciseSchema = new Schema({
  username: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date,
  userId: {type: String, required: true}
})

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select('_id username');
  if (users) {
    res.json(users);
  } else {
    res.send('No Users');
  }
})

app.post('/api/users', async (req, res) => {
  let userObj = new User({
    username: req.body.username
  })

  try{
    const user = await userObj.save();
    res.json({
      username: user.username,
      _id: user._id.toString()
    })
  } catch (err) {
    console.log(err)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date} = req.body;

  try{
    const user = await User.findById(id);
    if(user) {
      const exerciseObj = new Exercise({
        username: user.username,
        description,
        duration: parseInt(duration),
        date: date ? new Date(date): new Date(),
        userId: id
      })

      const exercise = await exerciseObj.save();
      res.json({
        username: exercise.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
        _id: user._id
      });
    } else {
        console.log('user not found')
      }
    
  } catch (err) {
    console.log(err)
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if(!user) {
    return res.send('No users found')
  }
  let date = {};
  if(from) {
    date['$gte'] = new Date(from);
  }
  if(to) {
    date['$lte'] = new Date(to);
  }
  let filter = {
    userId: id
  }
  if(from || to) {
    filter['date'] = date
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500);
  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: new Date(e.date).toDateString()
  })) 

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
