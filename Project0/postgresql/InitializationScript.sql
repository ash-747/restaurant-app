CREATE TABLE Restaurant(
	RestaurantId SERIAL PRIMARY KEY,
	RestaurantName VARCHAR(32) UNIQUE NOT NULL, 
	RestaurantPassword VARCHAR(32) NOT NULL
)

CREATE TABLE Refrigerator(
	FridgeId SERIAL PRIMARY KEY,
	RestaurantId INTEGER,
	Food1 VARCHAR(32), 
	Food2 VARCHAR(32),
	Food3 VARCHAR(32),
	Food4 VARCHAR(32),
	Food5 VARCHAR(32),
	FOREIGN KEY (RestaurantId) REFERENCES Restaurant (RestaurantId)
)

CREATE TABLE Inspector(
	InspectorId SERIAL PRIMARY KEY,
	InspectorName VARCHAR(32) UNIQUE NOT NULL,
	InspectorPassword VARCHAR(32) NOT NULL
)

CREATE TABLE InspectorRefrigeratorJunction(
	FridgeId INTEGER,
	InspectorId INTEGER,
	PRIMARY KEY (FridgeId, InspectorId),
	FOREIGN KEY (FridgeId) REFERENCES Refrigerator (FridgeId),
	FOREIGN KEY (InspectorId) REFERENCES Inspector (InspectorId)
)

INSERT INTO Restaurant (RestaurantName, RestaurantPassword) VALUES ('run1', 'rpw1');
INSERT INTO Restaurant (RestaurantName, RestaurantPassword) VALUES ('run2', 'rpw2');
INSERT INTO Inspector (InspectorName, InspectorPassword) VALUES ('iun1', 'ipw1');
INSERT INTO Inspector (InspectorName, InspectorPassword) VALUES ('iun2', 'ipw2');

SELECT * FROM Restaurant;
SELECT * FROM Refrigerator;
SELECT * FROM Inspector;
SELECT * FROM InspectorRefrigeratorJunction;

INSERT INTO Refrigerator (RestaurantId, Food1, Food2) VALUES(2, 'peanut', 'butter');

INSERT INTO InspectorRefrigeratorJunction (FridgeId, InspectorId) VALUES (7, 2);

SELECT * FROM Inspector WHERE InspectorName = 'un1';
SELECT * FROM Restaurant WHERE RestaurantName = 'un1';

DROP TABLE InspectorRefrigeratorJunction;
DROP TABLE Inspector;
DROP TABLE Refrigerator;
DROP TABLE Restaurant;

SELECT c.FridgeId, c.RestaurantId, c.Food1, c.Food2, c.Food3, c.Food4, c.Food5
FROM inspector a 
INNER JOIN inspectorrefrigeratorjunction b 
ON a.inspectorid = b.inspectorid 
INNER JOIN Refrigerator c
ON b.fridgeid = c.fridgeid
WHERE a.inspectorid = 1;

SELECT Food1, Food2, Food3, Food4, Food5
    FROM Refrigerator
    WHERE FridgeId = 5;
   
SELECT COUNT(*)
FROM Refrigerator
WHERE RestaurantId = 1;

commit;