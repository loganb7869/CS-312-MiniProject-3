import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import pg from 'pg';
import session from 'express-session';
import passport from "passport";
import path from 'node:path';
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Pool } = pg;

/* express and port declartaion */
const app = express();
const port = 3000;

// database connection declaration
const pool = new Pool({
    connectionString: 'postgres://postgres:ghdSfb39$@localhost:5432/BlogDB',
});

/* set view enginer for ejs */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

/* middleware */
app.use(morgan("tiny"));
app.use(express.static("public"));

// session middleware
app.use(
    session({
        secret: "TOPSECRETWORD",
        resave: false,
        saveUninitialized: true,
    })
);

/* request handlers */
app.get("/", async (req, res) => {
    const result = await pool.query('SELECT * FROM blogs ORDER BY date_created DESC');
    res.render("index.ejs", {
        title: "Home Page",
        blogs: result.rows,
        userId: req.session.userId
    });
});

// handler for signup form
app.get('/signup', async (req, res) => {
    res.render('signup.ejs', {
        title: "Sign Up",
        error: null 
    });
});

// user signup into database
app.post('/signup', async (req, res) => {
    // get user information
    const { user_id, password, name } = req.body;

    // lookup if user exists in database
    try {
        // check if the user id exists
        const exists = await pool.query('SELECT * FROM users WHERE user_id=$1', [user_id]);
        
        // if the user id is recongized
        if (exists.rows.length > 0) {
            // return an error
            return res.render('signup.ejs', { 
                title: "Sign Up", 
                error: 'User already exists. Sorry!' });
        }

        // add user into database
        await pool.query('INSERT INTO users (user_id, password, name) VALUES ($1,$2,$3)', [user_id, password, name]);
        
        // go to sign in page
        res.redirect('/signin');
    } catch (err) {
        // return error if creating user fails
        console.error(err);
        res.send('Error creating user. Try again later!');
    }
});

// handler for sign out form
app.get('/signout', async (req, res) => {
    res.render('signout.ejs', {
        title: "Sign Out",
        error: null 
    });
});

// sign the user out
app.post('/signout', async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(404).send("Cannot log out. Try again.");
        }
    })

    res.redirect("/");
});

// per post form
app.get("/POST_ID/:id", async (req, res) => {

    const postId = Number(req.params.id);

    try {
        const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [postId]);

        if (result.rowCount === 0) {
            return res.status(404).send("Post not found. Sorry!");
        }

        res.render("post_edit.ejs", {
            title: "Post Edit",
            post: result.rows[0]
        });

    } catch (err) {
        // return error post id display fails
        console.error(err);
        res.send('Error finding post. Try again later!');
    }
});

// post deletion
app.get("/POST_ID/:id/delete", async (req, res) => {
    const postId = Number(req.params.id);

    try {
        const result = await pool.query('DELETE FROM blogs WHERE blog_id = $1',
            [postId]
        );

        if (result.rowCount === 0) {
            return res.status(404).send("Post not found. Sorry!");
        }

        res.redirect("/");

    } catch (err) {
        console.error(err);
        res.status(404).send("Error deleting post. Sorry!");
    }
});

// signin page
app.get('/signin', (req, res) => {
    res.render('signin.ejs', {
        title: "Sign In",
        error: null 
    });
});

// signin handler
app.post('/signin', async (req, res) => {
    const { user_id, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE user_id=$1 AND password=$2', [user_id, password]);

    if (result.rows.length === 0) {
        return res.render('signin', { 
            title: "Sign In",
            error: 'Username or password is incorrect.' });
    }

    // store user id and name in session storage
    req.session.userId = result.rows[0].user_id;
    req.session.userName = result.rows[0].name;

    // redirect back to homepage
    res.redirect('/');
});

// blog form creation
app.get('/new_post', (req, res) => {
    res.render('new_post.ejs', {
        title: "Create New Post",
        error: null,
        userId: req.session.userId,
        userName: req.session.userName
    });
});

/* per blog post submission  */
app.post("/new_post", async (req, res) => {
    const { title, body } = req.body;

    let creator_user_id = req.session.userId;
    let creator_name = req.session.userName;

    await pool.query('INSERT INTO blogs (creator_name, creator_user_id, title, body) VALUES ($1,$2,$3,$4)',
        [creator_name, creator_user_id, title, body]
    );

    res.redirect("/");
});

/* editing blog post submission  */
app.post("/POST_ID/:id", async (req, res) => {
    const postId = Number(req.params.id);

    const { title, body } = req.body;

    try {
        const result = await pool.query('UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3',
            [title, body, postId]
        );

        if (result.rowCount === 0) {
            return res.status(404).send("Post not found. Sorry!");
        }

        res.redirect("/");

    } catch (err) {
        console.error(err);
        res.status(404).send("Error updating post. Sorry!");
    }
});

app.post("/POST_ID/:id/delete", async (req, res) => {
    const postId = Number(req.params.id);

    try {
        const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1',
            [postId]
        );

        if (result.rowCount === 0) {
            return res.status(404).send("Post not found. Sorry!");
        }

        res.render("delete.ejs", {
            title: "Deleting Post...",
            post: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(404).send("Error deleting post. Sorry!");
    }
});

app.use((req, res) => {
    res.status(404).send("<h1>Page not found</h1>");
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});