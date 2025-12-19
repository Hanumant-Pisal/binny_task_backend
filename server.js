const express = require('express');
require('dotenv').config()
require('./config/database')

const app = express();

const port = process.env.PORT;





app.get("/test",(req,resp)=>{
    resp.send("Api is working...")
})



app.listen(port, ()=>{
    console.log(`server started at port ${port}`);
    
})