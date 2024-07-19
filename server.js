const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');
const app = express();

let db;

const url = 'mongodb+srv://ethan:ethan416@class.qjri8hi.mongodb.net/?retryWrites=true&w=majority&appName=class';

new MongoClient(url).connect().then((client) => {
    console.log('db connect success');
    db = client.db('Mypage');
    db1 = client.db('forum');

    app.listen(3000, () => { // Change the port here
        console.log('http://localhost:3000 server working'); // Update the port in the message
    });
}).catch((error) => {
    console.error('db connect error:', error);
});

app.use(express.static(__dirname +'/public'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

//start
app.get('/', (req, res) => {
    res.send('Hello and Welcome');
})

//login
app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', async(req, res) => {
    try {
        let success = false;

        // Fetch all documents from the 'Login' collection
        let result = await db.collection('login').find().toArray();
        console.log(result[0].Password);

        // Example: Logging IDs from the list
        for (let i = 0; i < result.length; i++) {
             // Safe access within loop
            if (req.body.Id == result[i].ID && req.body.password == result[i].Password) {
                success = true; // Update success when credentials match
                break;
            }
        }

        if (success) {
            res.render("homepage");
        } else {
            // When there's no ID found or invalid, render login page with error message
            res.render('login', { error: "Invalid credentials. Please try again." });
        }
    } catch (error) {
        console.error('Error fetching login information:', error);
        res.render('login', { error: "An error occurred. Please try again later." });
    }
});

//homepage
app.get('/homepage', (req,res) => {
    res.render('homepage');
})

//Q/A board

app.get('/list', async(req,res) =>{
    let result = await db1.collection('post').find().toArray()
    res.render('list.ejs', {list : result});
});

app.post('/add', async (req, res) => {
    try {
        if (req.body.title == '') {
            res.send('no message');
        } else {
            await db1.collection('post').insertOne({ title: req.body.title, content: req.body.content});
            res.redirect('/list');
        }
    } catch (e) {
        console.log(e);
        res.status(500).send('wrong message');
    }
});

app.get('/write', (req,res) => {
    res.render('write.ejs');

})

app.get('/detail/:id', async (req, res) => {
    try {
      let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id) })
      if (result == null) {
        res.status(400).send('no info')
      } else {
        res.render('detail.ejs', { result : result })
      }
      
    } catch(e){
      res.send('wrong info')
    }
    
  })


app.get('/time', (req, res) => {
    try {
        res.render('time.ejs', { data: new Date() });
    } catch (error) {
        res.status(500).send('error while rendering time');
    }
});

app.get('/coding', async(req, res) =>{
    let result = await db.collection('post').find().toArray();
    let firstItem = result[1];
    res.render('login', {firstItem : firstItem});
})





//url 파라미터 문법


  app.get('/edit', async (req, res) => {
    let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id) })
    res.render('editdetail.ejs', {result : result})
  })

  app.get('/edited/:id', async(req, res) =>{
    let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id) })
    res.render('edit.ejs', {result : result})
  })

  app.get('/qa', (req,res) =>{
    res.render('qa.ejs');
  })

  app.get('/test', async(req,res) => {
    let result = await db1.collection('post').find().toArray();
    console.log(result[0].title);

  })

  


//1. 유저가 /detail/~~~ 로 접속하면
//2. _id 글을 DB에서 받아오고
//3. EJS 에서 글을 받아서 유저에게 보냄


