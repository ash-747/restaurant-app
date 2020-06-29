/* eslint-disable new-cap */
/* eslint-disable max-len */
const express = require('express');
const myDB = require('./../project0Express');

/**
 * @Return {*}
 */
function routes() {
  const sessionRouter = express.Router();

  sessionRouter.route('/login')
      .get( (req, res) => {
        if (req.session.currentUsername) {
          res.json({'error_message': 'You are already logged in. ' +
            'Use route /currentSession to see the currently logged in account.'+
            ' Use /logout to exit the current session.'});
        } else {
          res.json({'message': 'Send a POST with username, password, and '+
            'type properties in the body to attempt a login.'});
          selectAllRestaurant();
          // console.log(req.body);
        }
      })
      .post( (req, res) => {
        if (req.session.currentUsername) {
          res.json({'error_message': 'You are already logged in. ' +
            'Use route /currentSession to see the currently logged in account.'+
            ' Use /logout to exit the current session.'});
        } else {
          // COMPARE BODY.USERNAME BODY.PASSWORD TO EXISTING RECORDS
          // USE BODY.TYPE TO NARROW THE SEARCH
          if ( !(req.body.type && req.body.username && req.body.password)) { // Check existence of necessary parameters
            res.json({'error_message': 'At least one of the necessary parameters '+
              '(username, password, type) is missing or empty.'});
            return;
          }

          const userType = (req.body.type).toLowerCase();

          if ( !(userType == 'restaurant' || userType == 'inspector')) { // Check validity of account type input
            res.json({'error_message': 'Invalid value for \'type\' parameter. '+
                'Must be of value \'restaurant\' or \'inspector\'.'});
            return;
          }

          validateLogin(req, res);
        }
      });

  sessionRouter.route('/register')
      .get( (req, res) => {
        if (req.session.currentUsername) {
          res.json({'error_message': 'You are already logged in. ' +
            'Use route /currentSession to see the currently logged in account.'+
            ' Use /logout to exit the current session.'});
        } else {
          res.json({'message': 'Send a POST with username, password, '+
            'password2, and type properties '+
            'in the body to attempt a login.'});
        }
      })
      .post( (req, res) => {
        if (req.session.currentUsername) {
          res.json({'error_message': 'You are already logged in. ' +
            'Use route /currentSession to see the currently logged in account.'+
            ' Use /logout to exit the current session.'});
        } else {
          // COMPARE BODY.USERNAME BODY.PASSWORD TO EXISTING RECORDS
          // USE BODY.TYPE TO NARROW THE SEARCH
          if ( !(req.body.type && req.body.username && req.body.password && req.body.password2)) { // Check existence of necessary parameters
            res.json({'error_message': 'At least one of the necessary parameters '+
              '(username, password, password2, type) is missing or empty.'});
            return;
          }

          const userType = (req.body.type).toString().toLowerCase();

          if ( !(userType == 'restaurant' || userType == 'inspector')) { // Check validity of account type input
            res.json({'error_message': 'Invalid value for \'type\' parameter. '+
                'Must be of value \'restaurant\' or \'inspector\'.'});
            return;
          }

          if ( req.body.password != req.body.password2) {
            res.json({'error_message': 'Password and Password2 do not match.'});
            return;
          }

          validateRegistration(req, res);
        }
      });

  sessionRouter.route('/me')
      .get( (req, res) => {
        if (req.session.currentUserId) {
          console.log('current account id:', req.session.currentUserId, 'current account username:', req.session.currentUsername);
          res.json({'user': req.session.currentUsername + '#' + req.session.currentUserId});
        } else {
          res.json({'error_message': 'Not currently logged in.'});
        }
      });

  sessionRouter.route('/logout')
      .get( (req, res) => {
        if (req.session.currentUsername) {
          req.session.destroy( () => {
            console.log('session destroyed');
          });
          res.json({'success_message': 'session destroyed'});
        } else {
          res.json({'error_message': 'There\'s already no one logged in'});
        }
      });

  return sessionRouter;
}

module.exports = routes;

/**
 *
 */
async function selectAllRestaurant() {
  let myDBConnection;

  try {
    myDBConnection = await myDB.pool.connect();
    const resultSet = await myDBConnection.query(`SELECT * FROM Restaurant`);
    console.table(resultSet.rows);
  } catch (error) {
    console.log(error);
    res.json({'error_message': 'Failure accessing database'});
  } finally {
    myDBConnection.release();
  }
};

/**
 * Queries the database for records in the table matching 'type' that have a name matching 'usrname,
 * then checks 'password' against the value for their password.
 * @param {*} req http request
 * @param {*} res http response
 */
async function validateLogin(req, res) {
  let passwordResults;
  let queryStr;
  let myDBConnection;

  try {
    myDBConnection = await myDB.pool.connect();

    // Query for the records that share the same username
    // An ugly way to make one query that will work with both restaurants and inspectors
    queryStr =
    `SELECT ${req.body.type}id AS id, ${req.body.type}name AS name, ${req.body.type}password AS password 
    FROM ${req.body.type} 
    WHERE ${req.body.type}name = '${req.body.username}'`;
    console.log(queryStr);

    passwordResults = await myDBConnection.query(queryStr);

    if ( !(passwordResults.rows.length > 0)) { // Check for username matches
      res.json({'error_message': 'Username not found in database.'});
      return;
    }

    // console.log(passwordResults.rows);

    if (passwordResults.rows[0].password != req.body.password) { // Check that passwords match
      res.json({'error_message': 'Incorrect combination of username and password.'});
      return;
    }

    // Found a username match that has a matching password, sets the session variables accordingly
    console.table(passwordResults.rows);
    req.session.currentUserId = passwordResults.rows[0].id;
    req.session.currentUsername = passwordResults.rows[0].name;
    req.session.currentUserType = req.body.type;
    console.log(req.session.currentUserId, req.session.currentUsername, req.session.currentUserType);
    res.json({'success_message': `Logged in as ${req.body.type} ${passwordResults.rows[0].name}`});
  } catch (error) {
    console.log(error);
    res.json({'error_message': 'Failure accessing database'});
  } finally {
    myDBConnection.release();
  }
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
async function validateRegistration(req, res) {
  let passwordResults;
  let queryStr;
  let myDBConnection;

  try {
    myDBConnection = await myDB.pool.connect();

    // Query for the records that share the same username
    // An ugly way to make one query that will work with both restaurants and inspectors
    queryStr =
    `SELECT ${req.body.type}id AS id, ${req.body.type}name AS name, ${req.body.type}password AS password 
    FROM ${req.body.type} 
    WHERE ${req.body.type}name = '${req.body.username}'`;
    console.log(queryStr);

    passwordResults = await myDBConnection.query(queryStr);

    if (passwordResults.rows.length == 0) { // Check for username matches
      queryStr =
      `INSERT INTO ${req.body.type} (${req.body.type}name, ${req.body.type}password) 
      VALUES ('${req.body.username}', '${req.body.password}')`;
      console.log(queryStr);

      await myDBConnection.query(queryStr);
      res.json({'success_message': 'Successfully registered new account ' + req.body.username +
                                   '. Please log in.'});
    } else {
      console.log(passwordResults.rows);
      res.json({'error_message': 'Username already taken.'});
      return;
    }
  } catch (error) {
    console.log(error);
    res.json({'error_message': 'Failure accessing database'});
  } finally {
    myDBConnection.release();
  }
}
