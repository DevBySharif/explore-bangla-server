const express=require('express')
const cors=require('cors')
const jwt=require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app=express()
const port=process.env.PORT || 5000

// middleware
app.use(express.json())
app.use(cors())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ide5est.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    
    const packageCollection=client.db('exploreBanglaDB').collection('tourPackages')
    const guidesCollection=client.db('exploreBanglaDB').collection('tourGuides')
    const storiesCollection=client.db('exploreBanglaDB').collection('touristStories')
    const usersCollection=client.db('exploreBanglaDB').collection('users')
    const bookingsCollection=client.db('exploreBanglaDB').collection('bookings')
    const wishlistCollection=client.db('exploreBanglaDB').collection('wishlist')


    // jwt related api
    app.post('/jwt',async(req,res)=>{
      
      const user=req.body
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
      res.send({token})
    })

    // middlewares
    const verifyToken=(req,res,next)=>{
      console.log('inside verify to token',req.headers.authorization);
      if(!req.headers.authorization){
        return res.status(401).send({message:'unauthorized access'})
      }
      const token=req.headers.authorization.split(' ')[1]
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
          return res.status(401).send({message:'unauthorized access'})
        }
        req.decoded=decoded
        next()
      })
    }

    const verifyAdmin=async(req,res,next)=>{
      const email=req.decoded.email
      const query={email:email}
      const user=await usersCollection.findOne(query)
      const isAdmin= user?.role === 'admin'
      if(!isAdmin){
        return res.status(403).send({message:'forbidden access'})
      }
      next()
    }






    app.get('/packages',async(req,res)=>{
        const result = await packageCollection.find().toArray()
        res.send(result)
    })
    app.get('/guides',async(req,res)=>{
        const result = await guidesCollection.find().toArray()
        res.send(result)
    })
    app.get('/stories',async(req,res)=>{
        const result = await storiesCollection.find().toArray()
        res.send(result)
    })
    
    // wishlist api
    app.post('/wishlist',async(req,res)=>{
      const wishlist=req.body
      console.log(wishlist);
      const result=await wishlistCollection.insertOne(wishlist)
      res.send(result)
    })
    app.get('/wishlist',async(req,res)=>{
      const result = await wishlistCollection.find().toArray()
      res.send(result)
  })

  app.delete('/wishlist/:id',async(req,res)=>{
    const userId = req.params.id
    const query={_id:new ObjectId(userId)}
    const result = await wishlistCollection.deleteOne(query)
    res.send(result)
  })


    // booking related api
    app.post('/bookings',async(req,res)=>{
      const bookingData=req.body
      const result=await bookingsCollection.insertOne(bookingData)
      res.send(result)
    })
    app.get('/bookings',async(req,res)=>{
      const result = await bookingsCollection.find().toArray()
      res.send(result)
  })

    // user related api
    app.post('/users',async(req,res)=>{
      const user = req.body
      console.log(user);
      const query={email:user.email}
      const existingUser=await usersCollection.findOne(query)
      if(existingUser){
        return res.send({message:'user already exist',insertedId:null})
      }
      const result=await usersCollection.insertOne(user)
      res.send(result)
    })

    app.get('/users',verifyToken,verifyAdmin,async(req,res)=>{
      console.log(req.headers);
      const result = await usersCollection.find().toArray()
      res.send(result)
    })



    app.patch('/users/admin/:id',verifyToken,verifyAdmin,async(req,res)=>{
      const userId=req.params.id
      const filter={_id:new ObjectId(userId)}
      const updatedDoc={
        $set:{
          role:'admin'
        }
      }
      const result = await usersCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })
    app.patch('/users/guide/:id',verifyToken,verifyAdmin,async(req,res)=>{
      const id=req.params.id
      const filter={_id:new ObjectId(id)}
      const updatedDoc={
        $set:{
          role:'guide'
        }
      }
      const result = await usersCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })

    app.get('/users/admin/:email',verifyToken,async(req,res)=>{
      const email=req.params.email
      console.log(req.decoded.email);
      if(email !== req.decoded.email){
        return req.status(403).send({message:'forbidden access'})
      }
      const query={email:email}
      const user= await usersCollection.findOne(query)
      let admin = false
      if(user){
        admin = user?.role === 'admin'
      }
      res.send({admin})
    })
    app.get('/users/guide/:email',verifyToken,async(req,res)=>{
      const email=req.params.email
      console.log(req.decoded.email);
      if(email !== req.decoded.email){
        return req.status(403).send({message:'forbidden access'})
      }
      const query={email:email}
      const user= await usersCollection.findOne(query)
      let guide = false
      if(user){
        guide = user?.role === 'guide'
      }
      res.send({guide})
    })

    app.delete('/users/:id',async(req,res)=>{
      const userId = req.params.id
      const query={_id:new ObjectId(userId)}
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('explore bangla is running ')
})

app.listen(port,()=>{
    console.log(`explore bangla server running on port ${port}`);
})