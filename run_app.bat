@echo off
title Running Remote Job Chat Application

echo Starting Backend Server...
start cmd /k "cd /d D:\my-job-chat-app\backend && node server.js"

echo Starting Frontend Web...
start cmd /k "cd /d D:\my-job-chat-app\frontend && npm start"

echo Application started successfully!