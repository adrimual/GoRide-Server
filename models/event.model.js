const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
            owner: {type: Schema.Types.ObjectId, ref: "User"},
            name: {
                type: String,
                required: true,
                maxlength: 40,
                minlength: 2,
                unique: true,
            },
            description: {
                type: String,
                required: true,
                maxlength: 500
            },
            startTime: {
                type: String,
                required: true
            },
            endTime: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            participants: [{
                type: Schema.Types.ObjectId,
                ref: "User"
            }]
}, {
    timestamps: true
})

const Event = mongoose.model("Event", eventSchema);

module.exports = Event