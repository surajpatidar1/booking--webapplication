if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

const express = require("express");
const app = express();
const listing = require("./models/listing");
const review = require("./models/reviews.js")
const mongoose  = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo")
const flash = require("connect-flash");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");
const ExpressErorr = require("./utils/ExpressErorr.js");
const wrapAsync = require("./utils/wrapasync.js");
const {listingSchema,reviewSchema} = require("./scehma.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const {isLoggedin,isOwner} = require("./middleware.js");

//cloud setup

const multer  = require('multer')
const {storage} = require("./cloudConfig.js");
const upload = multer({ storage });

const dbUrl = process.env.ATLASDB_URL;
main().then(()=>{console.log("db connected..");})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

//sessions
const store = MongoStore.create({
    mongoUrl: "mongodb+srv://surajpatidar498:XQO4rBenuZaTDePQ@cluster0.psxrv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    crypto: {
        secret: process.env.SECRET_CODE,
    },
    touchAfter: 24 * 3600,
});

store.on("error",()=>{
    console.log("Error in Mongodb",err)
});
const sessionOptions = {
    store,
    secret:  process.env.SECRET_CODE,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7* 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

//authentication

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()) );

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// display flash message

app.use(( req, res, next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentuser = req.user;
    next();
});

app.use("/",userRouter);

//validation for data

const validateListing = (req,res,next) => {
    let {error} = listingSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el)=> el.message).join(",");
        throw new ExpressErorr(400, errMsg);
    }else{
        next();
    }
};

const validateReview = (req,res,next) => {
    let {error} =reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el)=> el.message).join(",");
        throw new ExpressErorr(400, errMsg);
    }else{
        next();
    }
};

//index route 

app.get("/listings", wrapAsync(async (req, res)=>{
    const alllistings = await listing.find({});
    res.render("listings/index.ejs",{alllistings});
   }));



// new route

app.get("/listings/new",isLoggedin,(req, res)=>
{
        res.render("listings/new.ejs");
    });

//show route

app.get("/listings/:id",isLoggedin,isOwner,wrapAsync(async(req, res)=>{
    let {id} = req.params;
  const Listing = await listing.findById(id).populate("Owner").populate("reviews");
  if(!Listing){
    req.flash("error", "Listing you requested for does not exist");
    res.redirect("/listings");
  }
  res.render("listings/show.ejs", { Listing});

}));

//create route 

app.post ("/listings",
    isLoggedin,
     upload.single("listing[image]"), 
     validateListing, 
     async(req, res,next)=>{ 
  
 let url = req.file.path;
 let filename = req.file.filename;
 const newlisting =   new listing (req.body.listing);
 newlisting.Owner = req.user._id;
 newlisting.image = {url,filename};
    await newlisting.save();
    req.flash("success","New Listing  Created!")
    res.redirect("/listings");
     
}) ;
    


//edit route

app.get("/listings/:id/edit",isLoggedin,isOwner,wrapAsync(async (req, res) =>{
    let {id} = req.params;
    const Listing = await listing.findById(id);
    if(!Listing){
        req.flash("error", "Listing you requested for does not exist");
        res.redirect("/listings");
      }
      let originalImageUrl = Listing.image.url;
      originalImageUrl = originalImageUrl.replace("/upload","/upload/h_300,w_250");
    res.render("listings/edit.ejs", {Listing,originalImageUrl});

}));

//update route 

app.put("/listings/:id",isLoggedin,isOwner, upload.single("listing[image]"),validateListing, wrapAsync(async (req, res)=>{
    let {id}= req.params; 
   let listing = await listing.findByIdAndUpdate(id,{...req.body.listing});
  
   if(typeof req.file != "undefined") {
   let url = req.file.path;
   let filename = req.file.filename;
   listing.image = {url,filename};
   await listing.save();
}
   req.flash("success"," Listing Updated!")
   res.redirect(`/listings/${id}`);
}));

//delete route

app.delete("/listings/:id",isLoggedin, isOwner,wrapAsync(async (req, res)=>{
    let {id}= req.params;
    await listing.findByIdAndDelete(id);
    req.flash("success","Listing  Deleted!")
    res.redirect("/listings");
}));

//reviews

app.post("/listings/:id/reviews",isLoggedin,validateReview,wrapAsync(async(req,res)=>{
let newlisting = await listing.findById(req.params.id);
let newReview = new review(req.body.review);
newReview.author = req.user._id;
newlisting.reviews.push(newReview);

await newReview.save();
await newlisting.save();
req.flash("success","New Review  Created!")

res.redirect(`/listings/${newlisting._id}`);

}));

//delete review

app.delete("/listings/:id/reviews/:reviewId",wrapAsync(async(req,res)=>{
let{id, reviewId} = req.params;
await listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
await review.findByIdAndDelete(reviewId);
req.flash("success","Review Deleted!")

res.redirect(`/listings/${id}`);
}));


 //search
app.post("/search",wrapAsync(async(req,res)=>{
    let searchQuery = req.body.search;
    const listings = await listing.find({$text: {$search: searchQuery}});
   if(listing.length === 0 ){
    req.flash("error","No listings found matching your search");
    return res.redirect("/listings");
   }
   req.flash("success","Listings is There");
   res.render("listings/index.ejs", { alllistings: listings });
   req.flash("success","Listings is There");
}));

app.all("*",(req,res,next)=>{
    next(new ExpressErorr(404, "page not found"));
});



//error handing

app.use((err,req,res,next)=>{
    let{statusCode = 500,message = "Somethings went Wrong.."} = err;
    res.render("listings/error.ejs",{err});
   // res.status(statusCode).send(message);
});




app.listen(8080 , ()=>{
    console.log("port 8080 is listening..");
});