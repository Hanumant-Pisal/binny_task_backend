const express = require("express");
const cors = require("cors")
const AuthRoutes = require("./routes/Auth.routes");
require("dotenv").config();
require("./config/database");

const app = express();

const port = process.env.PORT;


app.use(express.json());
app.use(cors());


app.use("/api/auth", AuthRoutes);


app.get("/test", (req, resp) => {
  resp.send("Api is working...");
});



app.listen(port, () => {
  console.log(`server started at port ${port}`);
});
