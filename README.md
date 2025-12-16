<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Project Overview

This project is a web-based scheduling tool that helps students automatically plan work sessions around their existing calendar. Users import their schedule, add tasks with deadlines, and the system fills free time with manageable work blocks. The goal is to reduce planning paralysis and help students, especially those with ADHD or executive dysfunction, know exactly when to work.

# AI Integration 
What the AI Does:
The AI assistant breaks down vague tasks, recommends work session lengths, explains steps, and handles rescheduling when tasks are missed.

Input and Output:
Users type natural language prompts. The AI returns clear steps, suggested session plans, and rescheduling options.

Why This AI Was Chosen:
Gemini was selected because it is effective at planning, task breakdown, and understanding natural language while integrating easily with the web interface.

How It Supports the Product:
The AI reduces cognitive load, helps users clarify assignments quickly, and removes the stress of manually planning or adjusting tasks. This directly supports the product goal of simplifying time management for overwhelmed students.

Example Prompt:
(Assuming a study session is already created) Move my Biology study session back a day.

# Demo Recording
https://notredame.zoom.us/rec/share/14e7RJDm1TU61XxZ9O0YHPMUVwv8ic4K2X1pJ5QGVAAsY8cSzmsqPfno4dDUvwlo.-pz0QeAFLWXUoiHj?startTime=1765848742000

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1BA9z09jwMHeKHnGeWUl9WEGTW_TZORvf

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
