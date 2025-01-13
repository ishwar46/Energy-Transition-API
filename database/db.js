const mongoose=require('mongoose');

// list of functions
const connectToDB=()=>{
    // connect to database(mongodb)
    mongoose.connect(process.env.DB_URL).then(()=>{
        console.log('Connected to database');
    }); 
}
// export
module.exports=connectToDB;