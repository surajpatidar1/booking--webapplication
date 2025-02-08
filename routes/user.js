const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
router.use(express.urlencoded({extended: true}));
const passport = require("passport");



router.get("/signup",(req,res)=>{
   res.render("user/signup.ejs");
});

router.post("/signup", async (req, res,next) => {
   try {
      const { username, password ,email} = req.body;
      const newUser = new User({ username,email });
      const registeredUser = await User.register(newUser, password);
      
          req.login(registeredUser,(err) =>{
            if(err){
               return next(err);
            }
          })
          req.flash("success", "Welcome!,User is successfully login");
          res.redirect("/listings");
      }
  catch (e) {
      req.flash("error", e.message);
      res.redirect("/signup");
  }

});

router.get("/login",(req,res)=>{
   res.render("user/login.ejs");
});

router.post("/login",
   passport.authenticate("local",{
      failureRedirect: "/login",
      failureFlash: true,
   }),
  async (req,res)=>{
req.flash("success","Welcome back to Booking!");
res.redirect("/listings");
});

router.get("/logout",(req,res,next)=>{
   req.logout((err)=>{
      if(err){
         next(err);
      }
      req.flash("success","You are logout successfully");
      res.redirect("/listings");
   })
});


module.exports = router;