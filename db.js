import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
//nota, aqui yace el server js, en caso de algun error borrar school.db 
// y descomentar await.db, en la terminal correr db.js y listo :3
const app = express();
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDb() {
    return open({
        filename: path.join(__dirname, 'school.db'),
        driver: sqlite3.Database
    });
}

async function seedDatabase() {
    const db = await setupDb();
    try {
        await db.run("DROP TABLE IF EXISTS Grades");
        await db.run("DROP TABLE IF EXISTS Subjects");
        await db.run("DROP TABLE IF EXISTS Students");

        await db.exec(`
            CREATE TABLE IF NOT EXISTS Students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                surname TEXT
            );
            CREATE TABLE IF NOT EXISTS Subjects (
                Subject_id INTEGER PRIMARY KEY AUTOINCREMENT,
                subject_Name TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS Grades (
                Grade_id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                subject_id INTEGER,
                score REAL,
                FOREIGN KEY(student_id) REFERENCES Students(id),
                FOREIGN KEY(subject_id) REFERENCES Subjects(Subject_id)
            );
        `);

        
        await db.run(`INSERT INTO Students (id, name, surname) VALUES 
            (1, 'Luis', 'Garcia'),
            (2, 'Sofia', 'Martinez'),
            (3, 'Mateo', 'Laguna'),
            (4, 'Isabella', 'Smith'),
            (5, 'Carlos', 'Ruiz'),
            (6, 'Ana', 'Perez')`);

        
        await db.run(`INSERT INTO Subjects (Subject_id, subject_Name) VALUES 
            (1, 'Math'), 
            (2, 'Literature'), 
            (3, 'Science'), 
            (4, 'History'), 
            (5, 'Computing')`);

        
        await db.run(`INSERT INTO Grades (student_id, subject_id, score) VALUES
            -- Luis (ID 1)
            (1, 1, 85.5), (1, 2, 90.5), (1, 3, 75.0), (1, 4, 95.5), (1, 5, 70.0),
            -- Sofia (ID 2)
            (2, 1, 92.0), (2, 2, 88.5), (2, 3, 95.0), (2, 4, 80.0), (2, 5, 90.0),
            -- Mateo (ID 3)
            (3, 1, 78.5), (3, 2, 82.0), (3, 3, 70.0), (3, 4, 85.0), (3, 5, 75.5),
            -- Isabella (ID 4)
            (4, 1, 95.0), (4, 2, 98.0), (4, 3, 91.5), (4, 4, 94.0), (4, 5, 99.0),
            -- Carlos (ID 5)
            (5, 1, 64.0), (5, 2, 70.0), (5, 3, 60.5), (5, 4, 68.0), (5, 5, 72.0),
            -- Ana (ID 6)
            (6, 1, 88.0), (6, 2, 85.0), (6, 3, 82.5), (6, 4, 90.0), (6, 5, 87.5)`);

        console.log("¡Base de datos relacional reseteada y cargada con éxito!");

    } catch (error) {
        console.error("Error en el seeding:", error);
    } finally {
        await db.close();
    }
}

app.get('/api/students', async (req, res) => {
    let db;
    try {
        db = await setupDb();
        const data = await db.all("SELECT id, name, surname FROM Students ORDER BY name ASC");
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (db) await db.close();
    }
});

app.get('/api/student/:id/grades', async (req, res) => {
    let db;
    try {
        db = await setupDb();
        const { id } = req.params;
        
        const query = `
            SELECT S.name, S.surname, Sub.subject_Name AS label, G.score AS value
            FROM Grades G
            JOIN Students S ON G.student_id = S.id
            JOIN Subjects Sub ON G.subject_id = Sub.Subject_id
            WHERE G.student_id = ?
        `;
        
        const data = await db.all(query, [id]);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (db) await db.close();
    }
});

const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`Servidor en http://localhost:${PORT}`);
    //await seedDatabase(); 
});
