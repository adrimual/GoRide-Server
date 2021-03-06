const express = require('express')
const router = express.Router()


const ValidationHandler = require("../../../validationHandler")
const validationHandler = new ValidationHandler()

//Models

const Event = require('../../../models/event.model')

//Helper functions

const isLoggedIn = (req, res, next) =>  req.isAuthenticated() ? next() : null

const isTheUserAllowed = (req, res, next) => req.user.id === req.params.id ? next() : null
const handleErrors = (err, req, res, next) => res.status(500).json({ message: "Oops, something went wrong... try it later :" })
const isFormValidated = (event, res, eventId) => {
    return validationHandler.isNameUnique(Event, event.name, res, eventId)
        .then(isNameUnique => {
            return isNameUnique &&
                validationHandler.areRequiredFieldsFilled(event, res, "name", "description", "startTime", "endTime", "city") &&
                validationHandler.isFieldLongEnough(event.name, res, 2, "name") &&
                validationHandler.isFieldTooLong(event.name, res, 40, "name") &&
                validationHandler.isFieldLongEnough(event.description, res, 40, "description") &&
                validationHandler.isFieldTooLong(event.description, res, 500, "description") &&
                validationHandler.isFutureDate(new Date(), event.startTime, res) &&
                validationHandler.isFutureDate(new Date(event.startTime), event.endTime, res)
        })
        .catch(err => next(err))
}

const deleteEventDetails = (res, eventId) => {
    Event.findByIdAndRemove(eventId)
        .then(deleteDetails => res.json(deleteDetails))
        .catch(err => next(err))
}
//to join an event
router.put('/join/:eventId/:id', isLoggedIn, isTheUserAllowed, (req, res, next) => {
    Event
        .findById(req.params.eventId, {participants: 1})
        .then(event => {
            const idx = event.participants.indexOf(req.params.id)
            if(idx == -1){
                event.participants.push(req.params.id)
                event.save()
            }
        })
        .then(() => res.json(req.params.id))
        .catch(err => next(err))
})
//to leave an event
router.put('/leave/:eventId/:userId', isLoggedIn, isTheUserAllowed, (req, res, next) => {
    Event
        .findById(req.params.eventId, {participants: 1})
        .then(event => {
            const idx = event.participants.indexOf(req.params.userId)
            if(idx >= 0){
                event.participants.splice(idx, 1)
                event.save()
            }
        })
        .then(() => res.json(req.params.userId))
        .catch(err => next(err))
})

//Get all events
router.get('/getAllEvents', (req, res, next) => {
    Event
        .find()
        .then(response => res.json(response))
        .catch(err => next(err))
})
//get all future events
router.get('/getAllFutureEvents', (req, res, next) => {
    Event
        .find({ endTime: { "$gte": new Date() } })
        .populate('owner')
        .then(response => res.json(response))
        .catch(err => next(err))
})

//get event owner
router.get('/getOwner/:eventId', (req, res, next) => {
    Event
        .findById(req.params.eventId)
        .populate('owner')
        .then(response => res.json(response))
        .catch(err => next(err))
})

// get events where user is owner
router.get('/:userId/owned', (req, res, next) => {
    Event
        .find({owner: req.params.userId})
        .then(response => res.json(response))
        .catch(err => next(err))
})

// get all future events of a user
router.get('/:userId/all/future', (req, res, next) => {
    Event
        .find({ endTime: { "$gte": new Date() }, participants: { $in: [req.params.userId] } })
        .then(response => res.json(response))
        .catch(err => next(err))
})

// get all events of a user
router.get('/:userId/all', (req, res, next) => {
    Event
        .find({ participants: { $in: [req.params.userId] } } )
        .then(response => res.json(response))
        .catch(err => next(err))
})

// get events where user is participant
router.get('/:userId/participant', (req, res, next) => {
    Event
        .find({ participants: { $in: [req.params.userId] }, owner: { $ne: req.params.userId } })
        .then(response => res.json(response))
        .catch(err => next(err))
})

//Create an Event
router.post('/create/:id', isLoggedIn, isTheUserAllowed, (req, res, next) => {
    isFormValidated(req.body, res)
        .then(validated => {
            if (validated) {
                Event
                    .create(req.body)
                    .then(() => res.json('created'))
                    .catch(err => console.log("error",err))
            }
        })
        .catch(err=>next(err))
})

//delete event
router.delete('/delete/:eventId/:id', isLoggedIn, isTheUserAllowed, (req, res, next) => {
    Event
        .findById(req.params.eventId)
        .then(() => deleteEventDetails(res, req.params.eventId))
        .catch(err => next(err))
})

//get an event
router.get('/event/:userId', (req, res, next) => {
    Event
        .findById(req.params.userId)
        .populate('participants')
        .then(response=>res.json(response))
        .catch(err => next(err))
})

//Get an event by name
router.get('/event/name/:eventName', (req, res, next) => {
    Event
        .findOne({name: req.params.eventName})
        .then(response => res.json(response))
        .catch(err => next(err))
})

//updating an event
router.put('/event/:eventId/:id', isLoggedIn, isTheUserAllowed, (req, res, next) => {
    isFormValidated(req.body, res,req.params.eventId)
        .then(validated => validated &&
        Event
            .findByIdAndUpdate(req.params.eventId, req.body, {new:true})
            .then(response => res.json(response))
            .catch(err => next(err))
        )
        .catch(err=>next(err))  
              
})

//get all events of a person
router.get('/:userId', (req, res, next)=> {
    Event
        .find({owner: req.params.userId})
        .then(response => res.json(response))
        .catch(err => next(err))
})
router.use(handleErrors)
module.exports = router