const express = require("express");
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['JamesHarden'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

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
const {findUserByEmail, generateRandomString, urlsForUser} = require("./helpers");


app.get("/", (req, res) => {
  const id = req.session.user_id;
  const templateVars = { user: users[id] };
  res.render("homepage", templateVars);
});

app.get("/register", (req, res) => {
  const id = req.session.user_id;
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
  if (findUserByEmail(email, users)) {
    return res.status(400).send('email is already in use');
  }

  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = {
    id,
    email,
    password: hashedPassword
  };
  req.session.user_id = id;
  res.redirect("/urls");
});

app.get("/signin", (req, res) => {
  const id = req.session.user_id;
  if (users[id]) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[id] };
  res.render("signin", templateVars);
});

app.post("/signin", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const existedUser = findUserByEmail(email, users);
  if (!email || !password) {
    return res.status(400).send('please include email AND password');
  }
  if (!existedUser) {
    return res.status(403).send('Wrong e-mail address');
  }
  const result = bcrypt.compareSync(password, existedUser.password);
  if (!result) {
    return res.status(403).send('Wrong password');
  }

  // res.cookie("user_id", existedUser.id);
  req.session.user_id = existedUser.id;
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const id = req.session.user_id;
  if (!users[id]) {
    return res.status(401).send('Need to sign in before use');
  }
  const templateVars = { user: users[id], urls: urlsForUser(id, urlDatabase) };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const id = req.session.user_id;
  if (!users[id]) {
    return res.redirect("/signin");
  }
  const templateVars = { user: users[id] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!users[userID]) {
    return res.status(401).send('Need to sign in before access');
  }
  let id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = {longURL, userID};
  res.redirect(`/urls/${id}`); 
});

app.post("/signout", (req, res) => {
  req.session = null;
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
  const id = req.session.user_id;
  if (!users[id]) {
    return res.status(401).send('Need to sign in before access');
  }
  if (!urlsForUser(id, urlDatabase)[req.params.id]) {
    return res.status(404).send('Page not found');
  }
  const templateVars = { user: users[id], id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('URL do not exist');
  }
  const id = req.session.user_id;
  if (!users[id]) {
    return res.status(401).send('Unauthorized');
  }
  if (!urlsForUser(id, urlDatabase)[req.params.id]) {
    return res.status(404).send('URL not found');
  }
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:id/update", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('URL do not exist');
  }
  const id = req.session.user_id;
  if (!users[id]) {
    return res.status(401).send('Unauthorized');
  }
  if (!urlsForUser(id, urlDatabase)[req.params.id]) {
    return res.status(404).send('URL not found');
  }
  urlDatabase[req.params.id].longURL = req.body.newLongURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('URL do not exist');
  }
  const id = req.session.user_id;
  if (!users[id]) {
    return res.status(401).send('Unauthorized');
  }
  if (!urlsForUser(id, urlDatabase)[req.params.id]) {
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