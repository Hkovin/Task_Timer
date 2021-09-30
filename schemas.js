const Joi = require("joi");

module.exports.taskSchema = Joi.object({
  //not mongoose schema bc validate data before save w mongoose
  //validation in server if make it past client side checks(use postman server request)
  task: Joi.object({
    title: Joi.string().required(),
    time: Joi.number().required().min(0),
    description: Joi.string(),
    day: Joi.string().required(),
  }).required(),
});
