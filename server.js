const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');
const app = express();

let db;

const url = 'mongodb+srv://ethan:ethan416@class.qjri8hi.mongodb.net/?retryWrites=true&w=majority&appName=class';

new MongoClient(url).connect().then((client) => {
    console.log('db connect success');
    db = client.db('forum');

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


app.get('/list', async(req,res) =>{
    let result = await db.collection('post').find().toArray()
    res.render('list.ejs', {list : result});
});

app.get('/', (req, res) => {
    res.send('Hello and Welcome');
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


app.get('/test', (req,res) => {
    res.send("hello.");
})

app.post('/add', async(req, res) => {
    let success = false;
    let list =  await db.collection('post').find().toArray();
    try {
        for(let i =0; i < list.length; i++){
             if (req.body.Id === list[i].ID && req.body.password === list[i].Password) {
            res.send("success")
            break;
            }
        }
        if(success) {
            res.send("success");
        }
        else{ //when there's no ID found or invalid back to original page.
            res.render('login');
        }
        
    } catch (e) {
        res.status(500).send('서버에러남');
    }
});

app.get('/write', (req,res) => {
    res.render('write.ejs');
  
     db.collection('post').insertOne({ title: req.body.title, content: req.body.content });
    res.redirect('/list');

})

app.get('/homepage', (req,res) => {
    res.render('homepage');
})


//url 파라미터 문법
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

  app.get('/edit', async (req, res) => {
    let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id) })
    res.render('editdetail.ejs', {result : result})
  })

  app.get('/edited/:id', async(req, res) =>{
    let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id) })
    res.render('edit.ejs', {result : result})
  })

  


//1. 유저가 /detail/~~~ 로 접속하면
//2. _id 글을 DB에서 받아오고
//3. EJS 에서 글을 받아서 유저에게 보냄


