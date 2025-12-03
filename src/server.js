import express from "express";

import routes from "./routes/routes.js";
import cors from "cors";

const app = express();

app.use(cors());

app.use(express.json());

app.use("/getCandy", routes);



const PORT = process.env.PORT || 3000;

// health check 
app.get("/api/health",(req,res) => 

{
  res.status(200).json({status:"Server is sick!"});
});

 app.listen(PORT, () => {
    console.log("Server is running on port", PORT);
  });



