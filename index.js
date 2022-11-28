const express = require('express');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId, Collection } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fkqwkjt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next)=>{
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.send(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        const usersCollection = client.db('bikery').collection('users');
        const categoryCollection = client.db('bikery').collection('categories');
        const productCollection = client.db('bikery').collection('products');
        const bookingsCollection = client.db('bikery').collection('bookings');

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            const query = { };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = {email};
            const user = await usersCollection.findOne(query);
            res.send({isAdmin : user?.role === 'admin'});
        });

        // Read All Cayegory Data
        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await categoryCollection.find(query).toArray();
            res.send(categories);
        });
          
        // Read All Products Data
        app.get('/allproducts', async (req, res) => {
            const query = {};
            const products = await productCollection.find(query).toArray();
            res.send(products);
        });
        
        // Read Specific Cayegory Data
        app.get('/categories/:id', async(req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const cursor = await productCollection.find(query);
            const selectedProducts = await cursor.toArray();
            res.send(selectedProducts);
          
          })
        
        // Read Specific Product Data
        app.get('/products/:id', async(req, res) => {
            const id = req.params.id;
            const query = { product_id: id };
            const cursor = await productCollection.find(query);
            const selectedProducts = await cursor.toArray();
            res.send(selectedProducts);
          
          })
        // Post Bookings
        app.post('/bookings', async (req, res) => {
            const bookings = req.body;
            // console.log(bookings);
            const query = {
                email: bookings.email,
                treatment: bookings.treatment
            }

            const alreadyBooked = await bookingsCollection.find(query).toArray();

            if (alreadyBooked.length){
                const message = `You have already booked ${bookings.appointmentDate}`
                return res.send({acknowledged: false, message})
            }

            const result = await bookingsCollection.insertOne(bookings);
            res.send(result);
        });
        
        app.put('/users/admin/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

    }
    finally {


    }
}
run().catch(console.dir);

app.get('/', async(req, res) => {
res.send('Server is running in full swing')
})


app.listen(port, () => {
console.log(`Example app listening on port ${port}`)
})