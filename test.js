const Store = require('./models/store');
const mongoose = require('mongoose');
require('dotenv').config();

const doGet = async () => {
    try {
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
            name: 1,
            address: 1
        });

        for (let store of allStores) {
            try {
                let index = store.address.search(/市|縣/);
                store.city = store.address.slice(index - 2, index + 1)
                console.log(store.name)
                console.log(store.city)
                await Store.findOneAndUpdate(
                    {_id: store._id},
                    store
                );
            } catch (e) {
                console.log(e)
            }
        }
    } catch (error) {
        console.log(error)
    }
}
doGet()

