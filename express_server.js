const express = require("express");
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const methodOverride = require('method-override');
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['JamesHarden'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(methodOverride('_method'));


// database
const urlDatabase = {};
const users = {};


// functions
const {findUserByEmail, generateRandomString, urlsForUser} = require("./helpers");


// routes
// home page
app.get("/", (req, res) => {
  const id = req.session.user_id;
  const templateVars = { user: users[id] };
  res.render("homepage", templateVars);
});

// register
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
    return res.status(400).send('Please include email AND password');
  }
  if (findUserByEmail(email, users)) {
    return res.status(400).send('This email is already in use');
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

// sign in
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
    return res.status(400).send('Please include email AND password');
  }
  if (!existedUser) {
    return res.status(403).send('Wrong e-mail address');
  }
  const result = bcrypt.compareSync(password, existedUser.password);
  if (!result) {
    return res.status(403).send('Wrong password');
  }
  req.session.user_id = existedUser.id;
  res.redirect("/urls");
});

// sign out
app.delete("/signout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

// urls index
app.get("/urls", (req, res) => {
  const id = req.session.user_id;
  if (!users[id]) {
    return res.status(401).send('<html><body><p>Need to <a href="/signin">sign in</a> before access</p></body></html>');
  }
  const templateVars = { user: users[id], urls: urlsForUser(id, urlDatabase) };
  res.render("urls_index", templateVars);
});

// new URL page
app.get("/urls/new", (req, res) => {
  const id = req.session.user_id;
  if (!users[id]) {
    return res.redirect("/signin");
  }
  const templateVars = { user: users[id] };
  res.render("urls_new", templateVars);
});

// create new URL
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!users[userID]) {
    return res.status(401).send('Need to sign in before using this service');
  }
  let id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = {longURL, userID};
  res.redirect(`/urls/${id}`);
});

// redirect the short URLs to their long URLs
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (!longURL) {
    return res.status(404).send('Page not found');
  }
  res.redirect(longURL);
});

// each short URL's detail page
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

// redirect to the detail page when clicking on the "edit" button on the URLs index page
app.patch("/urls/:id", (req, res) => {
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

// update(edit) the new long URL for our short URL
app.put("/urls/:id", (req, res) => {
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

// delete the URL when clicking the "delete" button on the URLs index page
app.delete("/urls/:id", (req, res) => {
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


// listen at the specific port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});