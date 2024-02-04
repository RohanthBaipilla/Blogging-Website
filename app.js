const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

process.env.TZ = 'Asia/Kolkata';

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;

mongoose.connect(`mongodb+srv://${username}:${password}@cluster0.mvx2new.mongodb.net/rohanth-blog`, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function () {
    console.log('Connected to MongoDB');
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads'); 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const postSchema = new mongoose.Schema({
    username: String,
    title: String,
    content: String,
    image: {
        data: Buffer, 
        contentType: String
    }
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);

const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
}, { timestamps: true });

const Contact = mongoose.model('Contact', contactSchema);


app.get('/', (req, res) => {
    const alertMessage = req.session.alertMessage;
    req.session.alertMessage = null;

    Post.find({})
        .then(posts => {
            res.render('index', { posts, alertMessage });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

app.get('/create', (req, res) => {
    const currentIndiaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    res.render('create', { currentIndiaTime });
});


app.post('/create', upload.single('image'), (req, res) => {
    const { username, title, content } = req.body;
    const image = req.file;

    let imageData = null;
    if (image) {
        imageData = {
            data: fs.readFileSync(image.path),
            contentType: image.mimetype
        };
    }

    Post.create({ username, title, content, image: imageData })
        .then(() => {
            console.log('Blog post created successfully');
            res.redirect('/');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

app.get('/post/:id', (req, res) => {
    const postId = req.params.id;

    Post.findById(postId)
        .then(post => {
            if (!post) {
                return res.status(404).send('Blog post not found');
            }

            res.render('post', { post });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

app.get('/post/:id/edit', (req, res) => {
    const postId = req.params.id;

    Post.findById(postId)
        .then(post => {
            if (!post) {
                return res.status(404).send('Blog post not found');
            }

            res.render('edit', { post });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

app.post('/post/:id/edit', (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;

    Post.findByIdAndUpdate(postId, { title, content })
        .then(() => {
            console.log('Blog post updated successfully');
            res.redirect(`/post/${postId}`);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

app.post('/post/:id/delete', (req, res) => {
    const postId = req.params.id;

    Post.findByIdAndDelete(postId)
        .then(() => {
            console.log('Blog post deleted successfully');
            res.redirect('/');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    Contact.create({ name, email, message })
        .then(() => {
            console.log('Contact message received successfully');
            req.session.alertMessage = 'Contact message received successfully';
            res.redirect('/');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});




app.get('/about', (req, res) => {
    res.render('about');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
