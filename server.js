const express = require("express");
const cors = require("cors")
const AuthRoutes = require("./routes/Auth.routes");
const userRoutes = require("./routes/User.routes")
const movireRoutes = require("./routes/movie.routes")
const errorMiddleware = require("./middleware/Error.middleware");
require("dotenv").config();
require("./config/database");

const app = express();

const port = process.env.PORT;


app.use(express.json());
app.use(cors());


app.use("/api/auth", AuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movireRoutes);


app.get("/test", (req, resp) => {
  resp.send("Api is working...");
});


app.use(errorMiddleware);


app.listen(port, () => {
  console.log(`server started at port ${port}`);
});
