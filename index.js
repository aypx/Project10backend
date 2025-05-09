import "dotenv/config";
import jwt from "jsonwebtoken";
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import {promises as fs} from 'fs'

const app = express();
const port = 3001;

app.use(express.json({limit: "10mb"}));

app.use(cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"]
}));


app.get("/projects", async (req, res) => {
    try{
        const response = await fs.readFile("./projects.json", "utf-8");
        const projectArray = JSON.parse(response);

        res.status(200).json(projectArray);
    } catch (e) {
        res.status(500).json({
            error: "error"
        });
    }
});

app.post("/projects", async (req, res) => {
    try {
        const fileData = await fs.readFile("./projects.json", 'utf-8');
        const projectArray = JSON.parse(fileData);
        const projectInput = req.body.projectData;
      
        let newId = projectArray.length.toString();
        projectInput.id = newId;

        projectArray.push(projectInput);
        await fs.writeFile("./projects.json", JSON.stringify(projectArray, null, 2));
    } catch (e) {
        res.status(500).json({error: "error"});
    }
});

app.get("/projects/:id", async (req, res) => {
    try{
        const response = await fs.readFile("./projects.json", "utf-8");
        const projectArray = JSON.parse(response);
        const requestId = req.params.id;

        for (let i=0; i<projectArray.length; i++) {
            if (projectArray[i].id === requestId) {
                res.status(200).json(projectArray[i]);
            }
        }
    } catch (e) {
        res.status(500).json({
            error: "error"
        });
    }
});

app.post("/login", async (req, res) => {
    const {username, password} = req.body;
  
    if (!username) {
        return res.status(400).json({
            error: "Malformed/Invalid Request Body -- Missing username"
        });
    } else if (!password) {
        return res.status(400).json({
            error: "Malformed/Invalid Request Body -- Missing password"
        });
    }
  
    try {
        const token = await authenticate(username, password);
  
        if (token === "error") {
            return res.status(401).json({error: "Unauthorized"});
        }
  
        res.status(201).json({token: token});

        localStorage.setItem("authToken", token)
    } catch (e) {
        res.status(500).json({
            error: e.message
        });
        console.log(e);
    }
});

async function authenticate(userInput,passInput) {
    const userFile = await getUsers();
    const usersArray = JSON.parse(userFile);
    const loginInput = userInput + passInput;
    const inputHash = crypto.createHash('sha256').update(loginInput).digest('hex');

    for (let i=0; i<usersArray.length; i++) {
        if (usersArray[i].hash === inputHash) {
            const data = {
                userId: usersArray[i].id
            }
            const token = jwt.sign(data, process.env.SECRET_KEY, {expiresIn: "1h"});
            //redirection 
            return token;
        }
    }  
    return ("error");
}

export async function getUsers() {
    const userResponse = await fs.readFile("./users.json", "utf-8");
    return userResponse;
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});
