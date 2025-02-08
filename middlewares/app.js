const express = require("express");
const ExpressError = require("./ExpressError");
const app = express();

//search localhost:8080/api?token=giveaccess

const checkedtoken = ("/api",(req,res,next)=>{
    let{token} = req.query;
    if(token === "giveaccess"){
        next();
    }
    throw new ExpressError(401,"ACCESS DENIED!!");
});
app.get("/api",checkedtoken,(req,res)=>{
    res.send("data is found..");
})


//404

app.use((req,res)=>{
    res.status(404).send("Page not Found !!");
});

app.use((err,req,res,next)=>{
    let{status,message} = err;
    res.status(status).send(message);
});

//activity

app.get("/admin",(req,res)=>{
    throw new ExpressError(403,"Access to admin is forbidden");

});

app.listen(8080,()=>{
    console.log("app is listening...");
});
