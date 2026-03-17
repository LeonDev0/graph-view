# Student Analytics Dashboard

Graph-view is a full-stack web application designed for academic data visualization. This project demonstrates the transition from a flat data model to a **relational database architecture**, allowing dynamic tracking of student performance across multiple subjects.

## Features
* **Relational Database:** Implemented with SQLite, featuring 3 linked tables (`Students`, `Subjects`, `Grades`) with Foreign Key constraints.
* **Dynamic API:** A Node.js/Express backend that serves student-specific data via REST endpoints.
* **Interactive Visualizations:** Powered by **Chart.js**, with bars that change color based on the student's average (Red for <70, Blue for standard, Gold for >90).
* **Data Export:** Capability to download the current chart as a PNG image for reporting.
* **Modern UI:** A clean, dark-mode interface focused on user experience.

##  Tech Stack
* **Frontend:** HTML5, CSS3, JavaScript (ES6+), Chart.js.
* **Backend:** Node.js, Express.js.
* **Database:** SQLite3.

## Project Structure
```text
├── db.js             # Database schema and Seeding logic
├── index.js          # Express server and API routes
├── index.html        # Dashboard interface
├── styles.js         # Frontend logic and Chart.js configuration
├── styles.css        # Custom styling (Dark Mode)
├── .gitignore        # Keeps the repo clean (ignores node_modules/ and .db)
└── package.json      # Project dependencies and scripts

 Setup & Installation
Clone the repository:

Bash
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
Install dependencies:

Bash
npm install
Initialize Data:
Ensure the seedDatabase() function is called in your setup to generate the initial records.

Run the application:

Bash
node index.js
Access: Open http://localhost:3000 in your browser.

 Key Learnings
This project served as a deep dive into SQL Relational Mapping. I learned how to move away from storing everything in a single table, instead using JOINs to connect entities. I also focused on bridging the gap between a persistent database and a reactive frontend.

Developed by LeoDEV