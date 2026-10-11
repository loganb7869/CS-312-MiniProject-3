import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";

/* express and port declartaion */
const app = express();
const port = 3000;

/* set view enginer for ejs */
app.set("view engine", "ejs");

/* local post storage */
const posts = [];

/* unique id per post */
let idNum = 1;

/* middleware */
app.use(bodyParser.urlencoded({extended: true}))
app.use(morgan("tiny"));
app.use(express.static("public"));

/* request handlers */
app.get("/", (req, res) => {
    res.render("index.ejs", {
        posts: posts,
        title: "Blog Homepage"
    });
});

app.get("/POST_ID/:id", (req, res) => {
    const postId = Number(req.params.id);
    const postLocation = posts.find(postLocation => postLocation.id === postId);

    res.render("post_edit.ejs", {
        title: "Post Edit",
        post: postLocation
    });
});

app.get("/POST_ID/:id/delete", (req, res) => {
    const postId = Number(req.params.id);
    const postLocation = posts.find(postLocation => postLocation.id === postId);

    res.render("delete.ejs", {
        title: "Post Deletion",
        post: postLocation
    });
});

/* per blog post submission  */
app.post("/submit", (req, res) => {
    const newPost = {
        id: idNum,
        userName: req.body.userName,
        blogTitle: req.body.blogTitle,
        date: new Date().toLocaleDateString('en-US'),
        blogContent: req.body.blogContent
    };

    idNum++;
    posts.push(newPost);
    console.log(posts);

    res.redirect("/");
});

/* editing blog post submission  */
app.post("/POST_ID/:id", (req, res) => {
    const postId = Number(req.params.id);
    const postLocation = posts.find(postLocation => postLocation.id === postId);

    postLocation.userName = req.body.userName;
    postLocation.blogTitle = req.body.blogTitle;
    postLocation.blogContent = req.body.blogContent;

    res.redirect("/");
});

app.post("/POST_ID/:id/delete", (req, res) => {
    const postId = Number(req.params.id);
    const postLocation = posts.find(postLocation => postLocation.id === postId);

    posts.splice(postLocation, 1);

    res.redirect("/");
});

app.use((req, res) => {
    res.status(404).send("<h1>Page not found</h1>");
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});