/* eslint-disable new-cap */
/* eslint-disable max-len */
// basically imports at runtime when called logic
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const {Pool} = require('pg');

// decides the port to connect with
const port = process.env.EXPRESS_PORT || 9001;
// creates an Express application calling the middleware & routes
const myApplication = express();

/* BODY PARSER MIDDLEWARE */
myApplication.use(bodyParser.urlencoded({extended: true}));
myApplication.use(bodyParser.json());

myApplication.set('trust proxy', 1);
myApplication.use(session({
  secret: 'key',
  resave: false,
  saveUninitialized: true,
  cookie: {maxAge: 24 * 60 * 60 * 1000}, // milli_seconds
}));

const myDB = new Pool({
  user: 'smgruver', // master username
  password: process.env.DB_PW, // master password
  host: 'a2-2b-9s.cjzyr2dqtkxq.us-east-2.rds.amazonaws.com', // AWS endpoint
  port: 5432, // port
  database: 'Project0', // database name
  max: 20, // number of connections in pool
  connectionTimeoutMillis: 0, // Time out a connection taking a long time to do something, loses the connection
  // 0 = No timeout
  idleTimeoutMillis: 0, // Time out for a connection not being used by its current user
});

/* // OUR MODEL
const Restaurant = require('./models/restaurantModel');
const Refrigerator = require('./models/refrigeratorModel');
const Inspector = require('./models/inspectorModel');
const Junction = require('./models/refrigerator-inspectorJunctionModel');

// OUR MOCK "DATABASE"
const p0Database = []; */

// ADD ROUTERS TO EXPRESS
const mainRouter = require('./routes/project0MainRouter')();
// ^ a call to the function imported from cartoonRouter with param allCartoons
myApplication.use('/main', mainRouter);
const sessionRouter = require('./routes/project0SessionRouter')();
myApplication.use('/account', sessionRouter);

myApplication.listen(port, () => {
  console.log('Running on the port: ' + port);
});

exports.pool = myDB;
