const StoreRelation = require('./models/storeRelation')
const Store = require('./models/store');
const mongoose = require('mongoose');
require('dotenv').config();
const go = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL_RS, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true,
            replicaSet: "rs0"
        });
        console.log('MongoDB Connected...');
    } catch (error) {
        throw new Error('connection broke');
    }
    const allStores = await Store.find({}, {
        _id: 1,
        name: 1
    });
    for (let store of allStores) {
        let newStore = {
            "storeId": store._id,
            "comments": [],
            "reviews": [],
            "followers": [],
            "owners": [],
            "author": null
        }
        await StoreRelation.create([newStore])
    }
    console.log("end")
}

go()
