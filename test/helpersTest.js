const { assert } = require('chai');

const { findUserByEmail, generateRandomString, urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const testUrlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

describe('findUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID);
  });
  it('should return null with non-existent email', function() {
    const user = findUserByEmail("user3@example.com", testUsers)
    assert.strictEqual(user, null);
  });
});

describe('generateRandomString', function() {
  it('should return a 6 digits random string', function() {
    const actualString = generateRandomString();
    assert.strictEqual(actualString.length, 6);
  });
});

describe('urlsForUser', function() {
  it('should only return longURL objects which contain the same user id', function() {
    const actualUserUrls = urlsForUser("userRandomID", testUrlDatabase);
    const expectedUserUrls = {
      "b2xVn2": {
        longURL: "http://www.lighthouselabs.ca",
        userID: "userRandomID"
      }
    };
    assert.deepEqual(actualUserUrls, expectedUserUrls);
  });
});