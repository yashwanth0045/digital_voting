import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "voting",
    password: "Yashwanth@45",
    port: 4545,
});

db.connect();

const app = express();

var cand = [
    {id:1,name:"candidate1",vote:0},
]

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/",(req,res)=>{
    res.render("home.ejs");
});

app.get("/loginpage",(req,res)=>{
    const m = req.query.message;
    console.log(m);
    res.render("login.ejs",{
        login:true,
        message:m,
    });
});

app.get("/registerpage",(req,res)=>{
    res.render("login.ejs",{
        login:false,
    });
});
var usn;
app.post("/vote",async(req,res)=>{
    var data = req.body;
    usn = data.voterID;
    var pass = data.password;
    const user = await db.query("select * from voters where usn = $1 AND password = $2",[usn,pass]);
    if(user.rows.length > 0){
        const v = user.rows[0].voted;
        console.log(v)
        if(!v){
            const can_data = await db.query("select * from candidate order by id asc");
            var can = can_data.rows;
            res.render("vote.ejs",{
            can:can
        });
        }
        else{
            res.redirect("/loginpage?message=You have already voted")
        }
        
    }
    else{
        res.redirect("/loginpage?message=invalid password or usn!")
    }
    // for(let i = 0;i<d.length ;i++){
    //     if(d[i].usn == voterid && d[i].password == pass){
    //         console.log("user present");
    //         console.log(d[i]);
    //         res.render("vote.ejs");
    //     }
    // }
});

var v_to_c;

app.post("/confirm",async(req,res)=>{
    console.log(req.body);
    v_to_c = req.body.id;
    var c = await db.query("select (name) from candidate where id = $1",[v_to_c]);
    var name = c.rows[0].name;
    console.log(v_to_c)
    res.render("confirm.ejs",{
        Candidate:name
    })
});

app.post("/decide",async(req,res)=>{
    const d = req.body.confirm;
    console.log(req.body)
    console.log(d)
    if(d === "no"){
        res.redirect("/loginpage");
    }
    else{
        await db.query("update candidate set votes = votes + 1 where id = $1",[v_to_c]);
        res.redirect("/");
        const data = await db.query("select * from candidate order by id asc")
        await db.query("update voters set voted = true where usn = $1",[usn])
        cand = data.rows;
        console.log(cand);
    }
});

app.post("/result",async(req,res)=>{
    const win = await db.query("select * from candidate where votes = (select MAX(votes) from candidate)")
    console.log(win.rows);
    const w = win.rows[0];
    res.render("result.ejs",{
        win:w
    });
});

app.listen(3000,()=>{
    console.log("server started at port 3000");
});