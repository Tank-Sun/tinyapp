// find user's information by email
const findUserByEmail = (email, database) => {
  for (const id in database) {
    const user = database[id];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

// generate a 6 digit random string
const generateRandomString = () => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for ( var i = 0; i < 6; i++ ) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
};

// only pull out the URL objects which contain the same user ID
const urlsForUser = (id, database) => {
  let urls = {};
  for (const shortURL in database) {
    if (database[shortURL].userID === id) {
      urls[shortURL] = database[shortURL];
    }
  }

  return urls;
};

module.exports = {findUserByEmail, generateRandomString, urlsForUser};