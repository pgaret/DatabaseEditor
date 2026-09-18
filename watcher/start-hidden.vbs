' Runs the save watcher with no console window; output goes to watcher.log
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = dir
sh.Run "cmd /c node watcher.js >> watcher.log 2>&1", 0, False
