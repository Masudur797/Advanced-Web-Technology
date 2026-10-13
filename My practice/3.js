
const university = "AIUB";
let students = [
    { id: 101, name: "Masudur Rahman", age: 23, marks: [85, 90, 78] },
    { id: 102, name: "Rahim Ahmed", age: 22, marks: [70, 65, 80] },
    { id: 103, name: "Karim Hasan", age: 24, marks: [92, 88, 95] },
    { id: 104, name: "Nusrat Jahan", age: 21, marks: [60, 72, 68] }
];

// Calculate average marks
function calculateAverage(marks) {
    const total = marks.reduce((sum, mark) => sum + mark, 0);
    return total / marks.length;
}

// Calculate grade
function calculateGrade(average) {
    if (average >= 80) {
        return "A+";
    } else if (average >= 70) {
        return "A";
    } else if (average >= 60) {
        return "B";
    } else if (average >= 50) {
        return "C";
    } else {
        return "F";
    }
}

// Display one student
function displayStudent(student) {
    const average = calculateAverage(student.marks);
    const grade = calculateGrade(average);

    console.log("--------------------------------");
    console.log("Student ID:", student.id);
    console.log("Name:", student.name);
    console.log("Age:", student.age);
    console.log("Marks:", student.marks.join(", "));
    console.log("Average:", average.toFixed(2));
    console.log("Grade:", grade);
}

// Display all students
function displayAllStudents() {
    console.log("\n===== STUDENT LIST =====");
    console.log("University:", university);

    students.forEach(function(student) {
        displayStudent(student);
    });
}

// Search student by ID
function searchStudent(id) {
    const student = students.find(function(item) {
        return item.id === id;
    });

    if (student) {
        console.log("\n===== SEARCH RESULT =====");
        displayStudent(student);
    } else {
        console.log("Student not found!");
    }
}

// Add a new student
function addStudent(id, name, age, marks) {
    const exists = students.some(function(student) {
        return student.id === id;
    });

    if (exists) {
        console.log("This student ID already exists!");
        return;
    }

    if (marks.length === 0 || marks.some(
        mark => mark < 0 || mark > 100
    )) {
        console.log("Invalid marks!");
        return;
    }

    const newStudent = {
        id: id,
        name: name,
        age: age,
        marks: marks
    };

    students.push(newStudent);
    console.log("Student added successfully!");
}

// Update student marks
function updateMarks(id, newMarks) {
    const student = students.find(item => item.id === id);

    if (!student) {
        console.log("Student not found!");
        return;
    }

    if (newMarks.length === 0 || newMarks.some(
        mark => mark < 0 || mark > 100
    )) {
        console.log("Invalid marks!");
        return;
    }

    student.marks = newMarks;
    console.log("Marks updated successfully!");
}

// Find the highest scoring student
function findTopStudent() {
    if (students.length === 0) {
        console.log("No students available!");
        return;
    }

    const topStudent = students.reduce((top, current) => {
        return calculateAverage(current.marks) >
            calculateAverage(top.marks) ? current : top;
    });

    console.log("\n===== TOP STUDENT =====");
    displayStudent(topStudent);
}

// Display students who passed
function displayPassedStudents() {
    console.log("\n===== PASSED STUDENTS =====");

    const passedStudents = students.filter(student => {
        return calculateAverage(student.marks) >= 50;
    });

    if (passedStudents.length === 0) {
        console.log("No passed students.");
        return;
    }

    passedStudents.forEach(student => {
        console.log(student.name, "-", calculateGrade(
            calculateAverage(student.marks)
        ));
    });
}

// Display statistics
function displayStatistics() {
    if (students.length === 0) {
        console.log("No student data available.");
        return;
    }

    const totalMarks = students.reduce((sum, student) => {
        return sum + calculateAverage(student.marks);
    }, 0);

    const overallAverage = totalMarks / students.length;

    console.log("\n===== STATISTICS =====");
    console.log("Total students:", students.length);
    console.log("Overall average:", overallAverage.toFixed(2));
}

// Run the program
console.log("Welcome to", university, "Student Management System!");

displayAllStudents();

searchStudent(101);

addStudent(105, "Sadia Islam", 22, [88, 91, 84]);

updateMarks(102, [85, 87, 90]);

findTopStudent();

displayPassedStudents();

displayStatistics();

console.log("\n===== PROGRAM FINISHED =====");
