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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
function generateRandomString() {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for ( var i = 0; i < 6; i++ ) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
};

function findUserByEmail(email) {
  for (const id in users) {
    const user = users[id];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

app.get("/", (req, res) => {
  const id = req.cookies.user_id
  const templateVars = { user: users[id] };
  res.render("homepage", templateVars);
});

app.get("/register", (req, res) => {
  const id = req.cookies.user_id
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
  console.log(users);
  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.get("/signin", (req, res) => {
  const id = req.cookies.user_id
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
  const templateVars = { user: users[id], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const id = req.cookies.user_id
  const templateVars = { user: users[id] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  // console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${id}`); // Redirect to the /urls/:id page
});

app.post("/signout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  const id = req.cookies.user_id
  const templateVars = { user: users[id], id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.newLongURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});