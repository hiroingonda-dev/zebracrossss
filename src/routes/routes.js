import express from "express";
import { getCandyList } from "../controllers/controllers.js";

const router = express.Router();

// get methods

router.get("/",getCandyList);


export default router;
