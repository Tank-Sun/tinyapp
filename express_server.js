const express = require("express");
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

// database
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// functions
const generateRandomString = () => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for ( var i = 0; i < 6; i++ ) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
};

const findUserByEmail = email => {
  for (const id in users) {
    const user = users[id];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

const urlsForUser = id => {
  let urls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  console.log('urls', urls);
  return urls;
};

app.get("/", (req, res) => {
  const id = req.cookies.user_id
  const templateVars = { user: users[id] };
  res.render("homepage", templateVars);
});

app.get("/register", (req, res) => {
  const id = req.cookies.user_id
  if (users[id]) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[id] };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send('please include email AND password');
  }
  if (findUserByEmail(email)) {
    return res.status(400).send('email is already in use');
  }

  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password
  };
  console.log('users', users);
  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.get("/signin", (req, res) => {
  const id = req.cookies.user_id
  if (users[id]) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[id] };
  res.render("signin", templateVars);
});

app.post("/signin", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const existedUser = findUserByEmail(email);
  if (!email || !password) {
    return res.status(400).send('please include email AND password');
  }
  if (!existedUser) {
    return res.status(403).send('Wrong e-mail address');
  }

  if (password !== existedUser.password) {
    return res.status(403).send('Wrong password');
  }

  res.cookie("user_id", existedUser.id);
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const id = req.cookies.user_id
  if (!users[id]) {
    return res.status(401).send('Need to sign in before use');
  }
  const templateVars = { user: users[id], urls: urlsForUser(id) };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const id = req.cookies.user_id
  if (!users[id]) {
    return res.redirect("/signin");
  }
  const templateVars = { user: users[id] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const userID = req.cookies.user_id
  if (!users[userID]) {
    return res.status(401).send('Need to sign in before access');
  }
  let id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = {longURL, userID};
  console.log("urlDatabase", urlDatabase);
  res.redirect(`/urls/${id}`); 
});

app.post("/signout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (!longURL) {
    return res.status(404).send('Page not found');
  }
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  const id = req.cookies.user_id
  if (!users[id]) {
    return res.status(401).send('Need to sign in before access');
  }
  if (!urlsForUser(id)[req.params.id]) {
    return res.status(404).send('Page not found');
  }
  const templateVars = { user: users[id], id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('URL do not exist');
  }
  const id = req.cookies.user_id
  if (!users[id]) {
    return res.status(401).send('Unauthorized');
  }
  if (!urlsForUser(id)[req.params.id]) {
    return res.status(404).send('URL not found');
  }
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:id/update", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('URL do not exist');
  }
  const id = req.cookies.user_id
  if (!users[id]) {
    return res.status(401).send('Unauthorized');
  }
  if (!urlsForUser(id)[req.params.id]) {
    return res.status(404).send('URL not found');
  }
  urlDatabase[req.params.id].longURL = req.body.newLongURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('URL do not exist');
  }
  const id = req.cookies.user_id
  if (!users[id]) {
    return res.status(401).send('Unauthorized');
  }
  if (!urlsForUser(id)[req.params.id]) {
    return res.status(404).send('URL not found');
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});