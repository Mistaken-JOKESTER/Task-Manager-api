const express = require('express')
const router = express.Router()
const Task = require('../models/task')
const auth = require('../middleware/auth')
const User = require('../models/user')

router.post('/tasks', auth, async (req, res) =>{
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try{
        await task.save()
        res.status(201).send(task)
    } catch(e) {
        req.status(500).send()
    }
})


//GET /tasks?complete = flase
//Get /task?limit=10&skip=0  give 10 results only
//skip = no of resluts to be skipped

router.get('/tasks', auth, async (req, res) => {

    const match = {}
    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }

    const sort = {}

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1]==='desc'?-1:1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)

    } catch(e) {
        res.status(500).send(e)
    }

})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({_id, owner: req.user._id})

        if(!task){
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['completed', 'discription']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid Update'})
    }

    try{
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})

        if(!task){
            return res.status(404).send()
        }
        
        updates.forEach(update => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch(e) {
            res.status(500).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
    try{
        if(!task){
            return res.status(404).send()
        }
    
        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }
    
})

module.exports = router