import express from "express"

const app = express();

app.use(express.json());

app.get("/", (req,res) => {
        res.json({
                msg : "server is running"
        })
});


app.listen(3000,()=>{
        console.log("Server is running on the port 3000");
})