---
name: commit-changes
description: Stage, commit, push changes, and create a PR to master
argument-hint: "Folder path to commit (optional, defaults to all changes)"
---

## Commit Changes Workflow

1. **Determine the target folder:**
   - If a folder path argument is provided, use that path
   - If no argument is provided, default to the entire repository (root)

2. **Validate the folder:**
   - Check if the folder exists
   - If the folder doesn't exist, show an error and ask the user for the correct path

3. **Check for changes:**
   - Run `git status` to see if there are any changes in the target folder
   - If no changes are found, inform the user that there's nothing to commit and exit

4. **Stage the changes:**
   - If a specific folder is provided: `git add <folder-path>`
   - If no folder provided (root): `git add .`

5. **Generate commit message:**
   - Analyze the staged files to auto-generate a descriptive commit message
   - Format: "Update <folder-name>: <brief description of changes>"
   - Example: "Update assets/styles: Add responsive design for mobile devices"

6. **Commit the changes:**
   - Run `git commit -m "<generated-message>"`

7. **Push to remote:**
   - Run `git push` to push the committed changes to the remote repository

8. **Create or update a Pull Request:**
   - Check if a PR already exists for the current branch: `gh pr list --head <current-branch> --state open`
   - If no open PR exists: run `gh pr create --base master --fill` to create one
   - If an open PR already exists: the push in step 7 automatically updates it — inform the user that the existing PR has been updated with the new changes

9. **Confirm completion:**
   - Show the user what was committed, pushed, and the PR URL
