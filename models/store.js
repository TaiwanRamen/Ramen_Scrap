const mongoose = require('mongoose');
//Schema Setup
const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a store name'],
        unique: true,
    },
    googleImages: [{
        type: String
    }],
    region: {
        type: String
    },
    city: {
        type: String
    },
    descriptionHTML: {
        type: String
    },
    address: String,
    location: {
        type: {
            type: String,
            enum: ['Point'],
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        },
        geoHash: String
    },
    rating: {
        type: Number,
        "default": 0,
        min: 0,
        max: 5
    },
    createdAt: {type: Date, default: Date.now()},
    tags: [{
        type: String
    }],
    phoneNumber: "",
    openPeriod: [{
        close: {
            day: {type: Number},
            time: {type: String},
        },
        open: {
            day: {type: Number},
            time: {type: String},
        }
    }],
    openPeriodText: [{
        type: String
    }],
    googleUrl: {type: String},
    storeUrl: {type: String}
}, {timestamps: true});


module.exports = mongoose.model("Store", storeSchema);