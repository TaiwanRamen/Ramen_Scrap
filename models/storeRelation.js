const mongoose = require('mongoose');
//Schema Setup
const storeRelationSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        unique: true,
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    }],
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    owners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
},);


module.exports = mongoose.model("StoreRelation", storeRelationSchema);