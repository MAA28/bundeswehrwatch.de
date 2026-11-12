import {MongoClient} from 'mongodb';

export const client = new MongoClient("mongodb+srv://ma28:550eZZWHr9t68L@cluster0.te4ubvi.mongodb.net/");

export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.dir(err);
    }
}

// Call this only when your application terminates
export async function disconnectFromMongoDB() {
    await client.close();
}