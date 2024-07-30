const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');

app.use(passport.initialize());
app.use(
    session({
        secret: '암호화에 쓸 비번',
        resave : false, //유저가 로그인을 안하더라도 들어가짐
        saveUninitialized: false, //유저가 들어올때마다 정보 경신할건지 안할건지
    })
)

app.use(passport.session());

let db;
let db1;

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
app.get('/login', (req, resp) => {
    resp.render('login');
})

app.post('/login1', async(req, res) => {
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

//wind's code

//Q/A board

app.get('/qa', async(req,res) =>{
    let result = await db1.collection('post').find().toArray()
    res.render('qa.ejs', {list : result});
  })

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
            res.redirect('/qa');
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

  app.get('/test', async(req,res) => {
    let result = await db1.collection('post').find().toArray();
    console.log(result[0].title);
    res.render('like');
  })

  


//1. 유저가 /detail/~~~ 로 접속하면
//2. _id 글을 DB에서 받아오고
//3. EJS 에서 글을 받아서 유저에게 보냄


app.get('/like', async (req, res) => {
    try {
        // Simulate token, in real application, it should come from authenticated session
        const token = req.headers.authorization?.split(' ')[1] || '';

        // Fetch posts from the database
        const posts = await db1.collection('post').find().toArray();

        // Render the EJS view and pass the posts and token
        res.render('like', { list: posts, token: token });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).send('An error occurred');
    }
});

// 좋아요 //
app.post('/like', async (req, res) => {
    const { post_Id } = req.body;
    const { token } = req.headers;

    try {
        // Verify the token and get the payload
        const payload = jwt.verify(token, 'team2-key');
        const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });
        
        if (!user) {
            return res.status(401).send({ message: 'User not found' });
        }
        const { name } = user;

        // Find the post by the post_Id
        let post = await db.collection('post').findOne({ _id: new ObjectId(post_Id) });
        
        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        let { like_user, like_count } = post;

        // Check if the user has already liked the post
        const likeIndex = like_user.indexOf(name);
        if (likeIndex > -1) {
            // User has already liked the post, so remove the like
            like_count -= 1;
            like_user.splice(likeIndex, 1);
        } else {
            // User has not liked the post, so add the like
            like_count += 1;
            like_user.push(name);
        }

        // Update the post in the database
        await db.collection('post').updateOne(
            { _id: new ObjectId(post_Id) },
            { $set: { like_user, like_count } }
        );

        // Fetch updated list of posts
        const post_list = await db.collection('post').find().toArray();

        // Render the updated like.ejs template
        res.render('like', { list: post_list, token: token });
    } catch (error) {
        console.error('Error processing like:', error);
        res.status(500).send({ message: 'An error occurred' });
    }
});



passport.use(new LocalStrategy(async (id, pw, cb) => {
    let result = await db.collection('user').findOne({ username : id})
    if (!result) {
      return cb(null, false, { message: '아이디 DB에 없음' })
    }
    if (result.password == pw) {
      return cb(null, result)
    } else {
      return cb(null, false, { message: '비번불일치' });
    }
  }))

  app.post('/login', async (req, resp, next) => {
    //비번일치시 세션 생성
    passport.authenticate('local', (error, user, info) => {
        if (error) return resp.status(500).json(error)
        if (!user) return resp.status(401).json(info.message)
        req.logIn(user, (err) => {
          if (err) return next(err)
          resp.redirect('/homepage') //가줄 사이트
        })
    })(req, resp, next)
  
  }) 

 passport.serializeUser((user, done) => {
    process.nextTick(() => {
      done(null, { id: user._id, username: user.username })
    })
  })

  passport.deserializeUser(async(user, done) => {
    let result = await db.collection('user').findOne({_id : new ObjectId(user.id) })
    delete result.password
    process.nextTick(() => {
      return done(null, result)
    })
  })


app.get('/ask', (req,res) => {
    res.render('createAPost')
})