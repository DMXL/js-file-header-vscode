const vscode = require("vscode");
const path = require("path");

Date.prototype.format = function (format) {
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(), //day
        "h+": this.getHours(), //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
        S: this.getMilliseconds() //millisecond
    };
    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
        }
    }
    return format;
};

function activate (context) {
    console.log('Extension "js-file-header" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand("extension.addJsFileHeader", function () {
        // The code you place here will be executed every time your command is executed
        var config = vscode.workspace.getConfiguration("jsFileHeader");
        console.log(config);

        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No open files, please open a file to add header!");
            return; // No open text editor
        }

        editor.edit(function (editBuilder) {
            try {
                editBuilder.insert(new vscode.Position(0, 0), compileFileHeader(config));
            } catch (error) {
                console.error(error);
            }
        });
    });

    var compileFileHeader = function (config) {
        var line = "/**\n";

        if (config.Copyright) {
            var copyright = config.Copyright.replace(/\n/g, "\n * ");
            line += " * {copyright}\n".replace("{copyright}", copyright);
            line += " *\n";
        }

        if (config.License) {
            var license = config.License.replace(/\n/g, "\n * ");
            line += " * {license}\n".replace("{license}", license);
            line += " *\n";
        }

        if (config.Description) {
            line += " * long description for the file\n";
            line += " *\n";
        }

        var activeEditor = vscode.window.editor || vscode.window.activeTextEditor;
        var filepath = activeEditor.document.fileName;
        var folders = vscode.workspace.workspaceFolders;
        var filename;

        if (folders.length == 1) {
            filename = filepath.split(folders[0].uri.path)[1];
        } else {
            folders.find(function (folder) {
                var bits = filepath.split(folder.uri.path);
                var bingo = bits.length > 1;

                filename = bits[bingo ? 1 : 0];
                return bingo;
            });
        }

        line += " * @file " + filename.slice(1) + "\n";
        line += " * @desc (description of the file)\n";
        line += " * @author {author}".replace("{author}", config.Author);
        line += config.Email ? " <{email}>".replace("{email}", config.Email) : "";

        line += "\n *\n";
        line += " * Created at     : {time}\n".replace("{time}", new Date().format("yyyy-MM-dd hh:mm:ss"));
        line += " * Last modified  : {time}\n".replace("{time}", new Date().format("yyyy-MM-dd hh:mm:ss"));
        line += " */\n\n";

        return line;
    };

    var getFileName = function () {

    };

    var fileHeaderFormatter = function () {
        setTimeout(function () {
            console.log("Invoke fileHeaderFormatter");
            try {
                var editor = vscode.editor || vscode.window.activeTextEditor;
                var document = editor.document;
                var lastModifiedRange = null;
                var lastModifiedText = null;
                var lineCount = document.lineCount;
                var found = false;
                var diff = 0;
                for (var i = 0; i < lineCount; i++) {
                    var linetAt = document.lineAt(i);
                    var line = linetAt.text;
                    line = line.trim();
                    if (line.indexOf("Last modified  :") > -1) {
                        var time = line
                            .replace("Last modified  : ", "")
                            .replace("*", "")
                            .replace(" ", "");
                        var oldTime = new Date(time);
                        var curTime = new Date();
                        diff = (curTime - oldTime) / 1000;
                        lastModifiedRange = linetAt.range;
                        lastModifiedText = " * Last modified  : {time}".replace("{time}", new Date().format("yyyy-MM-dd hh:mm:ss"));
                        found = true;
                    }
                    if (found) {
                        break;
                    }
                }
                if (found && diff > 15 && lastModifiedRange != null) {
                    console.log("Replace last modified time");
                    setTimeout(function () {
                        editor.edit(function (edit) {
                            edit.replace(lastModifiedRange, lastModifiedText);
                        });
                        document.save();
                    }, 200);
                }
            } catch (error) {
                console.error(error);
            }
        }, 200);
    };

    context.subscriptions.push(disposable);
    context.subscriptions.push(compileFileHeader);

    // Listen to file changes and run formatter
    vscode.workspace.onDidSaveTextDocument(fileHeaderFormatter);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate () { }
exports.deactivate = deactivate;
