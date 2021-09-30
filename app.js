if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const Task = require("./models/task");
const catchAsync = require("./utilities/catchAsync");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utilities/ExpressError");
const app = express();
const session = require("express-session");
const path = require("path");
const { taskSchema } = require("./schemas.js");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const helmet = require("helmet");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
app.engine("ejs", ejsMate); //to define layout files
const usersRoutes = require("./routes/users");
const taskRoutes = require("./routes/tasks");
const mongoSanitize = require("express-mongo-sanitize");

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/ScheduleBuilder";
const secret = "weirdsecret";
mongoose.connect(dbUrl, {
  useUnifiedTopology: true,
});
const MongoStore = require("connect-mongo");
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:")); //check if error
db.once("open", () => {
  //if no error say database connected
  console.log("Database connected");
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true })); //pasrse through body
app.use(methodOverride("_method"));
app.use(helmet({ contenetSecurityPolicy: false }));

app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize());

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60, //stop unnessessary updates so dont coninuously update page
  crypto: {
    secret: "squirrel",
  },
});
store.on("error", function (e) {
  console.log("Session Store Error", e);
});

const sessionConfig = {
  store, //mongo to store info
  name: "cookieSession", //dont use default name
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    //extra security
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //date.now in milliseconds
    maxAge: 1000 * 60 * 60 * 24 * 7, //expreation
  },
};
app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser()); //how to serialize a use/ how to store user in session
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/tasks", taskRoutes);
app.use("/", usersRoutes);
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/users/:id", function (req, res) {
  User.findById(req.params.id, function (err, user) {
    if (err) {
      console.log(err);
    }
    res.render("profile", { user: user });
  });
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err; //500 is defult value
  if (!err.message) err.message = "Error! Something Went Wrong!";
  res.status(statusCode).render("error", { err });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});
