const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function loadEnv() {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                process.env[match[1]] = match[2].trim();
            }
        });
    }
}

loadEnv();

const uri = process.env.MONGODB_URI;
// console.log("Testing connection to:", uri); 

const client = new MongoClient(uri);

async function run() {
    try {
        console.log("Attempting to connect...");
        await client.connect();
        console.log("Connected successfully to server");
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error("Connection failed details:", error);
    } finally {
        await client.close();
    }
}
run();
