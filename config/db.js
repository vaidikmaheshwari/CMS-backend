const mongoose =require("mongoose");

const connectDB = async()=>{
    return mongoose
    .connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology:true,
    })
    .then(()=>console.log( `DB connected successfully...`))
    .catch((err)=>console.log(err));
};

module.exports = connectDB;