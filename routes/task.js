const express = require("express");
const router = express.Router();
const Task = require("../models/task");
const catchAsync = require("../utilities/catchAsync");
const ExpressError = require("../utilities/ExpressError");
const extra = require("../public/extra");
const { taskSchema } = require("../schemas.js");
const { isLoggedIn } = require("../middleware");
const { listeners } = require("../models/task");

const validateTask = (req, res, next) => {
  //middleware
  const { error } = taskSchema.validate(req.body); //destructure result to get elements from array
  if (error) {
    const message = error.details.map((el) => el.message).join(",");
    throw new ExpressError(message, 400);
  } else {
    next();
  }
};
const isUser = async (req, res, next) => {
  const temp = await Task.find({});
  const tasks = [];
  for (task of temp) {
    if (task.owner) {
      if (task.owner.equals(req.user._id)) {
        console.log(tasks[0]);
        tasks[0] = temp;
      }
      temp.shift();
    }
  }
  next();
};
router.get(
  "/index",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const temp = await Task.find({});
    const tasks = [];
    let i = 0;
    for (task of temp) {
      if (task.owner) {
        if (task.owner.equals(req.user._id)) {
          tasks[i] = task;
          i++;
        }
      }
    }
    res.render("index", { tasks });
  })
);

router.get("/new", isLoggedIn, (req, res) => {
  res.render("tasks/new");
});

router.post(
  "/index",
  validateTask,
  isLoggedIn,
  catchAsync(async (req, res, next) => {
    //if (!req.body.task) throw new ExpressError("Invalid Task Data", 400);
    const task = new Task(req.body.task);
    task.owner = req.user._id;
    await task.save();
    req.flash("success", "sucessfully made a new task");
    res.redirect(`/tasks/${task._id}`);
  })
);

router.get(
  "/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const task = await Task.findById(req.params.id).populate("owner");
    if (!task) {
      req.flash("error", "Cannot find that task!");
      return res.redirect("/tasks/index");
    }
    res.render("tasks/show", { task });
  })
);

router.get(
  "/:id/edit",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) {
      req.flash("error", "Cannot find that task!");
      return res.redirect("/tasks/index");
    }
    res.render("tasks/edit", { task });
  })
);
//validateTask runs first
router.put(
  "/:id",
  validateTask,
  isLoggedIn,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const task = await Task.findByIdAndUpdate(id, { ...req.body.task });
    req.flash("success", "Successfully updated task!");
    res.redirect(`/tasks/${task._id}`);
  })
);

router.delete(
  "/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Task.findByIdAndDelete(id);
    req.flash("success", "Successfully deleted task");
    res.redirect("/tasks/index");
  })
);

module.exports = router;
