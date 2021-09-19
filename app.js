const express = require('express');
const mongoose = require('mongoose');
const Task = require('./models/task');

const ejsMate = require('ejs-mate');

const app = express();
const path = require('path');
const methodOverride = require('method-override');
app.engine('ejs', ejsMate)//to define layout files


mongoose.connect('mongodb://localhost:27017/ScheduleBuilder', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));//check if error
db.once("open", () => {//if no error say database connected
    console.log("Database connected");
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }))//pasrse through body
app.use(methodOverride('_method'));
app.get('/', async (req, res) => {
    const tasks =  await Task.find({});
    res.render('index', {tasks})
 });


app.get('/tasks/new', (req,res) => {
    res.render('tasks/new');
})

app.post('/tasks', async(req, res) =>{
    const task = new Task(req.body.task);
    await task.save();
    res.redirect(`/tasks/${task._id}`)
})

app.get('/tasks/:id', async (req, res,) => {
    const task = await Task.findById(req.params.id)
    res.render('tasks/show', { task });
});



app.get('/tasks/:id/edit', async (req, res,) => {
    const task = await Task.findById(req.params.id)
    res.render('tasks/edit', { task });
});

app.put('/tasks/:id', async (req,res) => {
    const { id } = req.params;
    const task = await Task.findByIdAndUpdate(id, { ...req.body.task });
    res.redirect(`/tasks/${task._id}`)
})

app.delete('/tasks/:id', async (req,res) => {
    const { id } = req.params;
    await Task.findByIdAndDelete(id);
    res.redirect('/');
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})