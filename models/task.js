const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
    title: String,
    day: String,
    time: Number,
    description: String
});

module.exports = mongoose.model('Task',  TaskSchema);
