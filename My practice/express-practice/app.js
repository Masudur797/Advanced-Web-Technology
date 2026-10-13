
const express = require("express");

const app = express();
const PORT = 3000;

// Read JSON data from requests
app.use(express.json());

// Temporary student database
let students = [
    { id: 1, name: "Masudur Rahman", department: "CSE", cgpa: 3.80 },
    { id: 2, name: "Rahim Ahmed", department: "CSE", cgpa: 3.65 },
    { id: 3, name: "Karim Hasan", department: "EEE", cgpa: 3.50 }
];

// Home route
app.get("/", (req, res) => {
    res.send("Student Management API is running!");
});

// GET: All students
app.get("/api/students", (req, res) => {
    res.json(students);
});

// GET: Student by ID
app.get("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);
    const student = students.find(s => s.id === id);

    if (!student) {
        return res.status(404).json({
            message: "Student not found"
        });
    }

    res.json(student);
});

// POST: Add a new student
app.post("/api/students", (req, res) => {
    const { name, department, cgpa } = req.body;

    if (!name || !department || cgpa === undefined ||
        typeof cgpa !== "number" || cgpa < 0 || cgpa > 4) {
        return res.status(400).json({
            message: "Provide valid name, department and CGPA (0-4)"
        });
    }

    const newStudent = {
        id: students.length
            ? Math.max(...students.map(s => s.id)) + 1
            : 1,
        name,
        department,
        cgpa
    };

    students.push(newStudent);

    res.status(201).json({
        message: "Student added successfully",
        student: newStudent
    });
});

// PUT: Update a student
app.put("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);
    const student = students.find(s => s.id === id);

    if (!student) {
        return res.status(404).json({
            message: "Student not found"
        });
    }

    const { name, department, cgpa } = req.body;

    if (
        !name ||
        !department ||
        typeof cgpa !== "number" ||
        cgpa < 0 ||
        cgpa > 4
    ) {
        return res.status(400).json({
            message: "Provide valid name, department and CGPA (0-4)"
        });
    }

    student.name = name;
    student.department = department;
    student.cgpa = cgpa;

    res.json({
        message: "Student updated successfully",
        student
    });
});

// DELETE: Remove a student
app.delete("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);
    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).json({
            message: "Student not found"
        });
    }

    const deletedStudent = students.splice(index, 1)[0];

    res.json({
        message: "Student deleted successfully",
        student: deletedStudent
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
