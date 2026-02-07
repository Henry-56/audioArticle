import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const API_KEY = "AIzaSyAUjDDOeGCfAgFsHIz2oX0xFzR8KnNtmCw";

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        let output = "Available Models:\n";
        if (data.models) {
            data.models.forEach(m => {
                if (m.name.includes("flash") || m.name.includes("lite")) {
                    output += m.name + "\n";
                }
            });
        } else {
            output += "No models found or error: " + JSON.stringify(data);
        }
        fs.writeFileSync('models_list.txt', output);
        console.log("Written to models_list.txt");
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
