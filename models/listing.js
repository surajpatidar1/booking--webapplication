const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review  = require("./reviews");
const listingSchema  = new Schema({
    title:{
        type: String,
        required:true,
    }  ,
    description: String,
    image: {
        url: String,
        filename: String,
    },
    price: Number,
    location: String,
    country: String,
    reviews: [
        {

            type: Schema.Types.ObjectId,
            ref: "Review",
        }
    ],
    Owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    }
});
listingSchema.index({title: "text", country: "text"});
listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){
        await Review.deleteMany({_id : {$in: listing.review}})
    }
});

const listing = mongoose.model("listing", listingSchema);
module.exports = listing;