var express = require('express');
var cors = require('cors')
var bodyParser = require('body-parser')
var validator = require('express-validator')
var app = express();
var Person = require('./models').Person

app.use(express.static('public'))
app.use(cors())
app.use(bodyParser.json())
app.use(validator())

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.json({message: 'API Example App'})
});

app.get('/person', (req, res) => {
  Person.findAll().then( (person) =>{
    res.json({person:person})
  })
})

app.post('/person', (req, res) => {
  Person.create({
    username: req.body.username,
    password: req.body.password,
}).then((person)=>{
    res.status(201)
    res.json({person: person})
  })
  req.checkBody('username', 'is required').notEmpty()
  req.getValidationResult()
   .then((validationErrors) =>{
       if(validationErrors.isEmpty()){
        Person.create({
          username: req.body.username,
          password: req.body.password
      }).then((person)=>{
          res.status(201)
          res.json({person: person})
        })
      }else{
        res.status(400)
        res.json({errors: {validations: validationErrors.array()}})
      }
    })
})
module.exports = app
