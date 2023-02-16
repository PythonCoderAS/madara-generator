import fs = require("fs");
import os = require('os');
import path = require("path");
import colors = require('colors/safe');
import prompt_sync = require("prompt-sync");
import {SourceTemplate, TestFileTemplate} from "./template"

interface MadaraGeneratorConfig {
    author: string,
    github_username: string,
    repo_path: string
}


const inputPrompt = prompt_sync();
const configPath: string = path.join(os.homedir(), ".madara-generator.json");
let config: MadaraGeneratorConfig;
if (!fs.existsSync(configPath)) {
    console.log("Config file not found, starting first-time setup.")
    const author = inputPrompt("What should the author of the Source be: ")
    let username = inputPrompt(`What should be the name of the user or repo to credit the Source? If empty, the author (${author}) will be assumed to be the repo author: `)
    if (!username.trim()) {
        username = author;
    }
    const repoPath = inputPrompt("What is the path of the repository where the content will be saved? Note: This should be the parent of the directory of where the 'Madara.ts' file is: ")
    config = {
        author: author,
        github_username: username,
        repo_path: repoPath
    }
    console.log(colors.yellow("Writing new config file."))
    try {
        fs.writeFileSync(configPath, JSON.stringify(config))
    } catch (e) {
        console.log(colors.red("Error while writing config: " + e));
        console.log(colors.red("Your config data has not been saved, and you will need to enter it on the next execution of this program."))
    }
} else {
    try {
        const data = fs.readFileSync(configPath, "utf-8");
        config = JSON.parse(data);
        console.log(colors.green("Read config. These are the values read:"))
        console.log(config);
        const option = inputPrompt("Type 'edit' to change config, or proceed: ")
        if (option.toLowerCase().trim() === "edit") {
            try {
                fs.rmSync(configPath)
            } catch (e) {
                console.log(colors.red("Unable to delete the config file. Please delete it yourself manually. The config file is located at " + configPath + "."))
                process.kill(process.pid, 'SIGINT');
            }
            console.log(colors.green("Config file deleted. Please restart the program."))
        }
    } catch (e) {
        console.log(colors.red("Error while reading config: " + e))
        try {
            fs.rmSync(configPath)
        } catch (e) {
            console.log(colors.red("Unable to delete the config file. Please delete it yourself manually. The config file is located at " + configPath + "."))
            process.kill(process.pid, 'SIGINT');
        }
        console.log(colors.red("The config file has been deleted, please restart the program to re-create it."))
        process.kill(process.pid, 'SIGINT');
    }
}
const name = inputPrompt("Enter the name of the source: ")
const baseUrl = inputPrompt("Enter the base URL: ").replace(/\/$/, "")
const iconPath = inputPrompt("Enter the location of the icon file: ")
const fileParts = path.parse(iconPath)

try {
    fs.mkdirSync(path.join(config.repo_path, "src", name, "includes"), {recursive: true});
} catch (e) {
    console.log(colors.red("Unable to make folder, exiting."))
    process.kill(process.pid, 'SIGINT');
}
try {
    fs.copyFileSync(iconPath, path.join(config.repo_path, "src", name, "includes", fileParts.base));
    console.log(colors.green("Copied icon file."))
} catch (e) {
    console.log(colors.red("Unable to copy icon file, exiting."))
    process.kill(process.pid, 'SIGINT');
}

try {
    fs.writeFileSync(path.join(config.repo_path, "src", name, name + ".ts"), SourceTemplate(name, baseUrl, fileParts.base, config.author, config.github_username));
    console.log(colors.green("Wrote source file."))
} catch (e) {
    console.log(colors.red("Unable to write source file, exiting."))
    process.kill(process.pid, 'SIGINT');
}

const mangaId = inputPrompt("Enter the manga ID used for testing: ")
const searchTerm = inputPrompt("Enter the search term used for testing: ")

try {
    fs.writeFileSync(path.join(config.repo_path, "src", "tests", name + ".test.ts"), TestFileTemplate(name, mangaId, searchTerm));
    console.log(colors.green("Wrote test file."))
} catch (e) {
    console.log(colors.red("Unable to write test file, exiting."))
    process.kill(process.pid, 'SIGINT');
}

console.log(colors.green("Done!"))