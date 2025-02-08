const listing = require("./models/listing");
module.exports.isLoggedin = (req,res, next)=>{
    
        if(!req.isAuthenticated()){
            req.flash("error","You must log in");
            return res.redirect("/login");
        }
        next();
} ;
    
module.exports.isOwner = async(req,res,next)=>{
    let {id}= req.params;
    let listingss = await listing.findById(id);
    if(!listingss.Owner._id.equals(res.locals.currentuser._id)){
        req.flash("error","You are not the owner of this listing");
       return res.redirect(`/listings/${id}`);
    }
   next();
}