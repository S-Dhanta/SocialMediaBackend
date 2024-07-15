import express from "express";
import router from "./routes/UserRoutes";
import postRouter from "./routes/FeedRoutes"

const app = express();

app.use(express.json());
app.use("/api/user", router);
app.use("/api/feed", postRouter);


app.listen(5000);
