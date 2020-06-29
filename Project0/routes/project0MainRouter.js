/* eslint-disable new-cap */
/* eslint-disable max-len */
const express = require('express');
const myDB = require('./../project0Express');
const { query } = require('express');

/**
 * @Return {*}
 */
function routes() {
  const mainRouter = express.Router();

  mainRouter.use( (req, res, next) => {
    if (!req.session.currentUsername) { // Check that they're logged in
      res.json({'error_message': 'Not currently logged in. Visit /account/login to fix that!'});
      return;
    } else {
      return next();
    }
  });

  mainRouter.route('/MyRefrigerators')
      .get( (req, res) => { // See the refrigerators you have access to
        if (req.session.currentUserType == 'restaurant') {
          // printRestaurantFridges(req, res);
          sqlQuery(req, res, printRestaurantFridges);
        } else if (req.session.currentUserType == 'inspector') {
          sqlQuery(req, res, printInspectorFridges);
        } else {
          res.json({'error_message': 'Invalid currentUserType!'});
          return;
        }
      })
      .post( (req, res) => { // RESTAURANTS ONLY: Add a new refrigerator to the account
        if (req.session.currentUserType != 'restaurant') {
          res.json({'error_message': 'This action is only permitted for restaurant-type users!'});
          return;
        } else {
          sqlQuery(req, res, addRestaurantFridge);
        }
      })
      .delete( (req, res) => { // RESTAURANTS: Delete a refrigerator,  INSPECTORS: Empty a refrigerator
        const toDelete = req.query.toDelete;

        if (!toDelete) {
          res.json({'error_message': 'Missing \'toDelete\' URI parameter. '+
            'End the URI with \'?toDelete=\' and then the FridgeId of the Refrigerator to be deleted.'});
          return;
        }

        if (req.session.currentUserType == 'restaurant') {
          // removeRestaurantFridge(req, res, toDelete);
          sqlQuery(req, res, removeRestaurantFridge, toDelete);
        } else { // currentUserType == Inspector
          sqlQuery(req, res, emptyInspectorFridge, toDelete);
        }
      });

  mainRouter.use('/refrigerators/:fridgeId',
      (req, res, next) => {
        if (!req.params.fridgeId) { // Check for the input
          res.json({'error_message': 'No refrigerator specified! '+
            'Follow \'/refrigerator/\' with the refrigerator\'s ID to access it!'});
          return;
        } else if (isNaN(req.params.fridgeId)) { // Check if fridgeId can be parsed to a number
          res.json({'error_message': 'Refrigerator ID should be a number!'});
          return;
        } else {
          return next();
        }
      });

  mainRouter.route('/refrigerators/:fridgeId')
      .get( (req, res) => { // Read the contents of this fridge
        sqlQuery(req, res, printFridgeContents);
      })
      .post( (req, res) => { // RESTAURANT ONLY: Add a food OR a Health Inspector to this fridge
        if (req.session.currentUserType == 'inspector') { // Check which type the user is
          res.json({'error_message': 'This action is only available to restaurant accounts!'});
          return;
        } else if (req.query.newFood) { // Check for the food name parameter
          sqlQuery(req, res, addFoodToFridge);
        } else if (req.query.newInspector && !isNaN(req.query.newInspector)) {
          sqlQuery(req, res, addInspectorToFridge);
        } else {
          res.json({'error_message': 'No food or inspector specified. '+
            'Follow the refrigerator ID Number with either \'?newFood=\' and the food name to add a food item '+
            'or \'?newInspector=\' and the inspector\'s ID Number to add an inspector'});
          return;
        }
      })
      .delete( (req, res) => { // Remove a food item
        if (req.query.removeAt && (req.query.removeAt >= 1 && req.query.removeAt <= 5)) { // Check for valid target index
          sqlQuery(req, res, removeOneFoodFromFridge);
        } else {
          res.json({'error_message': 'No food specified. '+
            'Follow the refrigerator ID Number with \'?removeAt=\' and the slot (1-5) of the food item to be removed.'});
          return;
        }
      })
      .patch( (req, res) => { // RESTAURANT ONLY: Move a food item to another fridge
        if (req.session.currentUserType == 'Inspector') { // Check for Restaurant user type
          res.json({'error_message': 'This action is only available to restaurant accounts!'});
          return;
        } else if (!(req.query.toMove && req.query.intoFridge)) { // Check for necessary input
          res.json({'error_message': 'Missing parameters! Please include toMove and intoFridge parameters in the URL!'});
          return;
        } else {
          sqlQuery(req, res, moveFoodToFridge);
        }
      });

  return mainRouter;
}

module.exports = routes;

/**
 * A handler that performs the tasks necessary to every query, like connecting the the database.
 * @param {Object} req HTTP Request
 * @param {Object} res HTTP Response
 * @param {function} operation The function to be performed after connecting
 * @param  {...any} other Catches any other variables passed into the query
 */
async function sqlQuery(req, res, operation, ...other) {
  let myDBConnection;

  try {
    myDBConnection = await myDB.pool.connect();

    await operation(req, res, myDBConnection, ...other);
  } catch (error) {
    console.log(error);
    res.json({'error_message': 'Error accessing the database.'});
    return;
  } finally {
    myDBConnection.release();
  }
}

/**
 * Prints all of the Refrigerators owned by the current restaurant
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 * @param {*} connection The pool connection being used
 * @param  {...any} other Catch-all for necessary parameters
 */
async function printRestaurantFridges(req, res, connection, ...other) {
  console.log(`SELECT * FROM Refrigerator WHERE RestaurantId = ${req.session.currentUserId}`);
  const restaurantFridges =
    await connection.query(`SELECT * FROM Refrigerator WHERE RestaurantId = $1`, [req.session.currentUserId]);
  console.table(restaurantFridges.rows);

  if (restaurantFridges.rows.length == 0) {
    res.json({'message': 'No refrigerators found for this account.'});
    return;
  } else {
    res.json(restaurantFridges.rows);
  }
}

/**
 * Checks whether or not the current account has access to the given refrigerator
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 * @param {*} connection SQL pool connection
 * @param {*} fridgeId The primary key of the fridge being checked
 * @return {boolean} whether or not the account has permission
 */
async function checkRefrigeratorAccess(req, res, connection, fridgeId) {
  let queryCheckFridgePermission;
  let resultCheckFridgePermission;

  if (req.session.currentUserType == 'restaurant') {
    // Check that the account has access to this fridge
    queryCheckFridgePermission =
      `SELECT * FROM Refrigerator 
      WHERE RestaurantId = ${req.session.currentUserId} AND FridgeId = ${fridgeId}`;
    console.log(queryCheckFridgePermission);
    resultCheckFridgePermission = await connection.query(queryCheckFridgePermission);
  } else if (req.session.currentUserType == 'inspector') {
    // Check that the account has access to this fridge
    queryCheckFridgePermission =
      `SELECT * FROM InspectorRefrigeratorJunction 
      WHERE InspectorId = ${req.session.currentUserId} AND FridgeId = ${fridgeId}`;
    console.log(queryCheckFridgePermission);
    resultCheckFridgePermission = await connection.query(queryCheckFridgePermission);
  } else {
    res.json({'error_message': 'Invalid user type'});
  }

  if (resultCheckFridgePermission.rows.length == 0) {
    res.json({'error_message': 'You do not have access to this fridge!'});
    return false;
  } else {
    return true;
  }
}

/**
 * Uses the currentUserId to find fridge's that the inspector has access to
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 * @param {Object} connection The SQL pool connection
 */
async function printInspectorFridges(req, res, connection, ...other) {
  const queryStr =
    `SELECT c.FridgeId, c.RestaurantId, c.Food1, c.Food2, c.Food3, c.Food4, c.Food5
    FROM inspector a 
    INNER JOIN inspectorrefrigeratorjunction b 
    ON a.inspectorid = b.inspectorid 
    INNER JOIN Refrigerator c
    ON b.fridgeid = c.fridgeid
    WHERE a.inspectorid = ${req.session.currentUserId}`;

  console.log(queryStr);
  const inspectorFridges =
      await connection.query(queryStr);
  console.table(inspectorFridges.rows);

  if (inspectorFridges.rows.length == 0) {
    res.json({'message': 'No refrigerators found for this account.'});
    return;
  } else {
    res.json(inspectorFridges.rows);
  }
}

/**
 * Adds a new Refrigerator tied to this currentUserId
 * @param {*} req HTTP request
 * @param {*} res HTTP Response
 * @param {Object} connection the SQL pool connection
 */
async function addRestaurantFridge(req, res, connection, ...other) {
  const queryStr =
    `INSERT INTO Refrigerator (RestaurantId) VALUES(${req.session.currentUserId})`;

  console.log(queryStr);
  await connection.query(queryStr);

  res.json({'success_message': 'Refrigerator sucessfully added to this account'});
}

/**
 * Accepts a URI parameter and removes the specified refrigerator from the db
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 * @param {Object} connection The SQL Pool Connection
 * @param {*} fridgeId The FridgeId of the fridge to be removed
 */
async function removeRestaurantFridge(req, res, connection, ...other) {
  const fridgeId = other[0];

  if (!checkRefrigeratorAccess(req, res, connection, fridgeId)) { // Check if the restaurant owns this fridge
    return;
  }

  // Check if there are other refrigerators in this restaurant
  const queryCountRefrigerators =
    `SELECT COUNT(*)
    FROM Refrigerator
    WHERE RestaurantId = ${req.session.currentUserId}`;
  console.log(queryCountRefrigerators);
  const resultCountRefrigerators = await connection.query(queryCountRefrigerators);
  if ((resultCountRefrigerators.rows[0])['count'] <= 1) {
    res.json({'error_message': 'You need at least 2 refrigerators to your account to be able to delete one.'});
    return;
  }

  // Move from this refrigerator to others
  // - Get all of the food from the current refrigerator
  const queryGetCurrentFood =
    `SELECT Food1, Food2, Food3, Food4, Food5
    FROM Refrigerator
    WHERE FridgeId = ${req.query.toDelete}`;
  console.log(queryGetCurrentFood);
  const resultCurrentFood = await connection.query(queryGetCurrentFood);
  console.table(resultCurrentFood.rows);
  // - - Save all of the actual food into an array
  let foodArray = [];
  for (const tempFood in resultCurrentFood.rows[0]) {
    if (resultCurrentFood.rows[0][tempFood] != null) {
      foodArray.push(resultCurrentFood.rows[0][tempFood]);
    }
  }
  console.log(foodArray);

  // All of the following 'if' block is unnecessary if there was no food in the fridge to be deleted
  if (foodArray.length > 0) {
    // - Get a list of this account's other refrigerators
    const queryGetOtherFridges =
      `SELECT *
      FROM Refrigerator
      WHERE RestaurantId = ${req.session.currentUserId} AND NOT FridgeId = ${req.query.toDelete}`;
    console.log(queryGetOtherFridges);
    const resultOtherFridges = await connection.query(queryGetOtherFridges);
    console.table(resultOtherFridges.rows);

    // - Iterate through the other refrigerators looking for open slots to insert food into
    for (let i = 0; i < resultOtherFridges.rows.length; i++) { // Iterate through the other fridges
      if (foodArray.length == 0) { // End early if the foodArray empties
        break;
      }

      let columnArr = [];
      for (let j = 1; j <= 5; j++) { // Iterate through the fridges' food columns
        const thisColumn = `food${j}`;
        if (resultOtherFridges.rows[i][thisColumn] == null) {
          columnArr.push(thisColumn);
        }
      }
      console.log(foodArray, columnArr);

      // - Insert the food into those open slots
      let queryInsertFood =
        `UPDATE Refrigerator
        SET`;
      while (columnArr.length > 0 && foodArray.length > 0) {
        queryInsertFood += ` ${columnArr.shift()} = '${foodArray.shift()}',`;
      }
      queryInsertFood = queryInsertFood.slice(0, -1); // slices off the last character: the comma
      queryInsertFood += ` WHERE FridgeId = ${resultOtherFridges.rows[i]['fridgeid']}`;
      console.log(queryInsertFood);
      await connection.query(queryInsertFood);
    }
  }

  // Remove records from junction table
  const queryRemoveFromJunction =
      `DELETE FROM InspectorRefrigeratorJunction WHERE FridgeId = ${fridgeId}`;
  console.log(queryRemoveFromJunction);
  await connection.query(queryRemoveFromJunction);

  // Remove records from Refrigerator table
  const queryRemoveFromRefrigerator =
      `DELETE FROM Refrigerator WHERE FridgeId = ${fridgeId}`;
  console.log(queryRemoveFromRefrigerator);
  await connection.query(queryRemoveFromRefrigerator);

  if (foodArray.length == 0) {
    res.json({'success_message': `Refrigerator #${fridgeId} has been removed.`});
  } else {
    res.json({'success_message': `Refrigerator #${fridgeId} has been removed, but some food could not be moved to other refrigerators due to a lack of space.`});
  }
}

/**
 * Empties the specified fridge if the current inspector has access to it.
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 * @param {Object} connection The SQL pool connection
 * @param {*} fridgeId
 */
async function emptyInspectorFridge(req, res, connection, ...other) {
  const fridgeId = other[0];

  if (!checkRefrigeratorAccess(req, res, connection, fridgeId)) { // Check if the account has access to this fridge
    return;
  }

  // Find the refrigerator in question out of the refrigerators the account has access to
  // Set all of its food slots to null
  const query2 =
      `UPDATE Refrigerator
      SET Food1 = null, Food2 = null, Food3 = null, Food4 = null, Food5 = null
      WHERE FridgeId = ${fridgeId}`;
  console.log(query2);
  await connection.query(query2);

  res.json({'success_message': `Refrigerator ${fridgeId} successfully emptied`});
}

/**
 * Prints the contents of the specified fridge if the current account has access
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 * @param {*} connection The SQL pool connection
 * @param  {...any} other Catches extra input parameters
 */
async function printFridgeContents(req, res, connection) {
  let queryStr;

  if (req.session.currentUserType == 'restaurant') {
    queryStr =
      `SELECT * FROM Refrigerator 
      WHERE FridgeId = ${req.params.fridgeId} AND RestaurantId = ${req.session.currentUserId}`;
  } else {
    queryStr =
    `SELECT c.FridgeId, c.RestaurantId, c.Food1, c.Food2, c.Food3, c.Food4, c.Food5
    FROM inspector a 
    INNER JOIN inspectorrefrigeratorjunction b 
    ON a.inspectorid = b.inspectorid 
    INNER JOIN Refrigerator c
    ON b.fridgeid = c.fridgeid
    WHERE a.inspectorid = ${req.session.currentUserId} AND c.FridgeId = ${req.params.fridgeId}`;
  }
  console.log(queryStr);
  const resultSet = await connection.query(queryStr);

  if (resultSet.rows.length == 0) {
    res.json({'error_message': 'You don\'t have access to any refrigerators with that ID number!'});
    return;
  } else {
    res.json(resultSet.rows);
    return;
  }
}

/**
 * Adds a food item to the current refrigerator
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 * @param {*} connection SQL Pool connection
 */
async function addFoodToFridge(req, res, connection) {
  const queryGetCurrentFood =
    `SELECT Food1, Food2, Food3, Food4, Food5 FROM Refrigerator 
    WHERE FridgeId = ${req.params.fridgeId} AND RestaurantId = ${req.session.currentUserId}`;
  console.log(queryGetCurrentFood);
  const resultsCurrentFood = await connection.query(queryGetCurrentFood);

  if (resultsCurrentFood.rows.length == 0) {
    res.json({'error_message': 'You do not have access to a fridge with this ID number!'});
    return;
  } else {
    // Find the first open food slot and insert it there. Return error if full.
    let targetFoodColumn;
    for (const tempFood in resultsCurrentFood.rows[0]) { // Find the first empty food column in the record
      if (resultsCurrentFood.rows[0][tempFood] != null) {
        continue;
      } else {
        targetFoodColumn = tempFood;
        break;
      }
    }

    if (!targetFoodColumn) {
      res.json({'error_message': 'This refrigerator is full! Remove at least one item and then try again.'});
      return;
    } else {
      const queryAddFood =
        `UPDATE Refrigerator 
        SET ${targetFoodColumn} = '${req.query.newFood}' 
        WHERE FridgeId = ${req.params.fridgeId}`;
      console.log(queryAddFood);
      await connection.query(queryAddFood);

      res.json({'success_message': `${req.query.newFood} successfully added to refrigerator #${req.params.fridgeId}`});
    }
  }
}

/**
 * Gives the specified Health Inspector permission to view the current refrigerator
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} connection SQL pool connection
 */
async function addInspectorToFridge(req, res, connection) {
  if (!checkRefrigeratorAccess(req, res, connection, req.params.fridgeId)) { // Check if the account has access to this fridge
    return;
  }

  // Check that the Inspector exists
  const queryCheckForInspector =
    `SELECT * FROM Inspector WHERE InspectorId = ${req.query.newInspector}`;
  console.log(queryCheckForInspector);
  const resultInspectorCheck = await connection.query(queryCheckForInspector);
  if (resultInspectorCheck.rows.length == 0) {
    res.json({'error_message': 'There are no inspectors with that ID Number!'});
    return;
  }

  // Add Fridge+Inspector combination to junction table
  const queryAddInspectorToFridge =
    `INSERT INTO InspectorRefrigeratorJunction (FridgeId, InspectorId) 
    VALUES (${req.params.fridgeId}, ${req.query.newInspector})`;
  console.log(queryAddInspectorToFridge);
  await connection.query(queryAddInspectorToFridge);

  res.json({'success_message': `Inspector #${req.query.newInspector} has been given permission to view Refrigerator #${req.params.fridgeId}.`});
}

/**
 * Removes the specified food from the fridge
 * @param {*} req HTTP request
 * @param {*} res HTTP Response
 * @param {*} connection SQL pool connection
 */
async function removeOneFoodFromFridge(req, res, connection) {
  if (!checkRefrigeratorAccess(req, res, connection, req.params.fridgeId)) { // Check if the account has access to this fridge
    return;
  }

  // Remove the specified contents
  const targetColumn = `Food${req.query.removeAt}`; // Food1, Food2, etc.
  const queryRemoveFood =
    `UPDATE Refrigerator
    SET ${targetColumn} = null
    WHERE FridgeId = ${req.params.fridgeId}`;
  console.log(queryRemoveFood);
  await connection.query(queryRemoveFood);

  res.json({'success_message': `Food item at index ${req.query.removeAt} of refrigerator #${req.params.fridgeId} removed.`});
}

/**
 * Moves a food item from one fridge to another
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 * @param {*} connection SQL pool connection
 */
async function moveFoodToFridge(req, res, connection) {
  if (!(checkRefrigeratorAccess(req, res, connection, req.params.fridgeId) && // Check if the account has access to this fridge
        checkRefrigeratorAccess(req, res, connection, req.query.intoFridge))) {
    return;
  }

  console.log(req.query.toMove, req.query.intoFridge);

  const fromColumn = `food${req.query.toMove}`;

  // Insert clone of food into new fridge
  // - Retrieve the food in the target fridge
  const queryCheckFoodSlots =
    `SELECT Food1, Food2, Food3, Food4, Food5
    FROM Refrigerator
    WHERE FridgeId = ${req.params.fridgeId}`;
  console.log(queryCheckFoodSlots);
  const resultFoodSlots = await connection.query(queryCheckFoodSlots);
  // - Find an open slot
  let targetColumn;
  for (const tempColumn in resultFoodSlots.rows[0]) {
    if (resultFoodSlots.rows[0][tempColumn] == null) {
      targetColumn = tempColumn;
      break;
    } else {
      continue;
    }
  }

  if (!targetColumn) {
    res.json({'error_message': 'This refrigerator is full! Remove at least one item and then try again.'});
    return;
  }
  // Add the food to the target slot
  // - Retrieve food from the fridge being moved out of
  const queryFindMovingFood =
    `SELECT ${fromColumn}
    FROM Refrigerator
    WHERE FridgeId = ${req.params.fridgeId}`;
  console.log(queryFindMovingFood);
  const resultMovingFood = await connection.query(queryFindMovingFood);
  console.log(resultMovingFood.rows);

  // - Grab the value of the food at the specified location
  let foodToMove;
  if ((resultMovingFood.rows).length == 0 || !(resultMovingFood.rows[0])[fromColumn]) {
    res.json({'error_message': `No food found at slot #${req.query.toMove} in refrigerator #${req.params.fridgeId}`});
    return;
  } else {
    foodToMove = (resultMovingFood.rows[0])[fromColumn];
  }

  // - Update the record of the target refrigerator
  const queryMoveFoodInto =
    `UPDATE Refrigerator
    SET ${targetColumn} =  '${foodToMove}'
    WHERE FridgeId = ${req.query.intoFridge}`;
  console.log(queryMoveFoodInto);
  await connection.query(queryMoveFoodInto);

  // Remove food from old fridge
  const queryMoveFoodOutOf =
    `UPDATE Refrigerator
    SET Food${req.query.toMove} = null
    WHERE FridgeId = ${req.params.fridgeId}`;
  console.log(queryMoveFoodOutOf);
  await connection.query(queryMoveFoodOutOf);

  res.json({'success_message': `Food#${req.query.toMove} moved from refrigerator #${req.params.fridgeId} to refrigerator #${req.query.intoFridge}.`});
}
