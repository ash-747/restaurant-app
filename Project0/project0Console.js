// Project 0: Restaurant Owner main file
// Handles the front end interface with the console
// Stephen Gruver, last edited 6/18/2020

let exit = false;
let loggedIn = false;
let currentUser = '';
let userType = 'visitor';
let userInput = '';
const simInput = [];

const loginMenu =
`Welcome to Stephen gruver's Project 0: Restaurant Owner!
What would you like to do?
1: Login
2: Create a New Account
0: Exit Program`;

const restaurantOwnerMainMenu =
`What would you like to do?
1: Open a Refrigerator
2: Add a New Refrigerator
3: Remove a Refrigerator
4: Add a Health Inspector to a Refrigerator
0: Logout`;

const restaurantOwnerFridgeMenu =
`What would you like to do?
1: Add a New Food Item
2: Remove a Food Item
3: Move a Food Item to Another Refrigerator
4: Add a Health Inspector to this Refrigerator
5: Remove this Refrigerator
0: Close this Refrigerator`;

const healthInspectorMainMenu =
`What would you like to do?
1: Open a Refrigerator
0: Logout`;

const healthInspectorFridgeMenu =
`What would you like to do?
1: Remove a Food Item
2: Empty the Refrigerator
0: Close the Refrigerator`;

do {
  // Welcome message & prompt for input
  loggedIn = false;
  userInput = requestMenuInput(loginMenu, 2);

  switch (userInput) {
    case 1:
    case 2:
    case 0: // CLOSE PROGRAM
      exit = true;
      break;
    default:
  }

  if (userInput == 0) { // EXIT LOOP & PROGRAM
    exit = true;
    break;
  } else if (userInput == 1) { // LOG IN TO EXISTING ACCOUNT
    loggedIn = logIn();
    currentUser = 'name';
    userType = 'RestaurantOwner';
    console.log('Welcome, ' + currentUser + '!');
  } else if (userInput == 2) { // CREATE AN ACCOUNT
    loggedIn = registerNewAccount();
    currentUser = 'name';
    userType = 'RestaurantOwner';
    console.log('Welcome, ' + currentUser + '!');
  } else { // REPROMPT FOR INPUT
    //
  }

  while (loggedIn) {
    if (userType == 'RestaurantOwner') {
      userInput = requestMenuInput(restaurantOwnerMainMenu, 4);

      // USER INPUT
      switch (userInput) {
        case 1: // OPEN REFRIGERATOR
          restaurantFridgeMenu();
          count = 0;
          break;
        case 2: // ADD REFRIGERATOR
          addRefrigerator();
          count = 0;
          break;
        case 3: // REMOVE REFRIGERATOR
          removeRefrigerator();
          count = 0;
          break;
        case 4: // ADD INSPECTOR TO REFRIGERATOR
          addInspectorToRegrigerator();
          count = 0;
          break;
        case 0: // LOG OUT
          exit = confirmLogOut();
          count = 0;
          break;
        default:
          console.log('Invalid input! Please enter an integer from 0 to 4.');
          count++;
      }
    } else if (userType == 'HealthInspector') {
      userInput = requestMenuInput(healthInspectorMainMenu, 1);

      switch (userInput) {
        case 1: // OPEN FRIDGE
          inspectorFridgeMenu();
          count = 0;
        case 0: // LOG OUT
          exit = confirmLogOut();
          count = 0;
        default:
          console.log('Invalid input! Please enter an integer from 0 to 1.');
          count++;
      }
    } else { // ERROR: Not Restaurant OR Inspector
      loggedIn = false;
    }
  }
} while (!exit && count < 3);

/**
 * Prompts for user input using a predefined string
 * Accepts the input within the given range. Returns -1 if 3 invalid entries.
 * @param {string} prompt the message to be output when asking for input
 * @param {number} maxValidInput the maximum valid input
 * @Return {number} valid input
 */
function requestMenuInput(prompt, maxValidInput) {
  let count = 0;
  let result = -1;
  let rawInput;

  console.log(prompt);

  return simInput.shift(); // FOR TESTING W/O USER INPUT

  do {
    count++;
    // ASK FOR USER INPUT
    if (rawInput >= 0 && rawInput <= maxValidInput) {
      result = rawInput;
      break;
    } else {
      console.log('Invalid input! Please enter a number ' +
        'between 0 and ' + maxValidInput + '.');
    }
  } while ( count <= 3 );

  return result;
}

/**
 * Prompts for existing username and password, then checks against database.
 * @Return {boolean} login status, either successful or not
 */
function logIn() {
  // PROMPT FOR EXISTING USERNAME
  // PROMPT for PASSWORD
  // CHECK COMBINATION AGAINST DATABASE
  // RETURN TRUE IF SUCCESSFUL, ELSE RETURN FALSE
  return true;
}

/**
 * Prompts for new username and matching passwords, then logs into that account
 * @Return {boolean} status of registration. True if successful, else false
 */
function registerNewAccount() {
  // PROMPT FOR UNUSED USERNAME
  // PROMPT FOR PASSWORD
  // PROMPT FOR RETYPED PASSWORD
  // SAVE TO DATABASE
  // RETURN TRUE IF SUCCESSFUL, ELSE RETURN FALSE
  return true;
}

/**
 * Asks the user if they're sure they want to want to log out.
 * If yes, ends session. If no, next iteration of input cycle.
 */
function confirmLogOut() {
  // ASKS IF THEY'RE SURE?
  // ENDS SESSION
}

/**
 * Opens the Restaurant fridge menu, accepts input, and handles it
 * until the user chooses to log out or enters invalid input 3 times in a row.
 */
function restaurantFridgeMenu() {
  let count = 0;

  do {
    userInput = requestMenuInput(restaurantOwnerFridgeMenu, 5);

    switch (userInput) {
      case 1: // ADD A FOOD
        count = 0;
        console.log('Ask for the name of the food');
        break;
      case 2: // REMOVE A FOOD
        count = 0;
        console.log('Ask which food, either by number or name');
        break;
      case 3: // MOVE A FOOD
        count = 0;
        console.log('Ask which food and which refrigerator');
        break;
      case 4: // ADD A HEALTH INSPECTOR
        count = 0;
        console.log('Ask which health inspector');
        break;
      case 5: // REMOVE REFRIGERATOR
        count = 0;
        console.log('Ask if they\'re sure');
        break;
      case 0: // CLOSE REFRIGERATOR
        count = 0;
        console.log('Exit the current loop and reprint main menu');
        break;
      default:
        count++;
        console.log('You entered invalid input!' +
          'Please input an integer between 0 and 5.');
    }
  } while (userInput != 0 && count <= 3);

  return;
}

/**
 * Opens the Restaurant fridge menu, accepts input, and handles it
 * until the user chooses to log out or enters invalid input 3 times in a row.
 */
function inspectorFridgeMenu() {
  let count = 0;

  do {
    userInput = requestUserInput(healthInspectorFridgeMenu, 2);

    switch (userInput) {
      case 1: // REMOVE A FOOD
        count = 0;
        console.log('Ask which food, either by number or name');
        break;
      case 2: // EMPTY A REFRIGERATOR
        count = 0;
        console.log('Ask if they\'re sure');
        break;
      case 0: // CLOSE REFRIGERATOR
        count = 0;
        console.log('Exit the current loop and reprint main menu');
        break;
      default:
        count++;
        console.log('You entered invalid input!' +
          'Please input an integer between 0 and 5.');
    }
  } while (userInput != 0 && count <= 3);

  return;
}

/**
 * Adds a refrigerator to the current user's restaurant.
 */
function addRefrigerator() {
  // ADD REFRIGERATOR TO CURRENT USER
}

/**
 * Removes a specified refrigerator from the current user's restaurant
 * and deletes any food inside.
 */
function removeRefrigerator() {
  // REMOVE REFRIGERATOR FROM CURRENT USER
  // EITHER ASK WITHIN FUNCTION OR PASS AS PARAMETER
}

/**
 * Gives a health inspector permission to view (and empty) a refrigerator.
 */
function addInspectorToRegrigerator() {
  // SPECIFY REFRIGERATOR UNLESS CALLED FROM FRIDGE MENU
  // SPECIFY INSPECTOR
}
