
 // Student information
const studentName = "Tanim";


// Array to store marks
const marks = [85, 72, 90, 45, 60];


// Function to calculate total marks
function calculateTotal(marks) {
    let total = 0;

    for (let i = 0; i < marks.length; i++) {
        total += marks[i];
    }

    return total;
}


// Function to calculate average
function calculateAverage(total, numberOfSubjects) {
    if (numberOfSubjects === 0) {
        return 0;
    }

    return total / numberOfSubjects;
}



// Function to find grade
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


// Function to check pass/fail
function checkResult(marks) {
    for (let i = 0; i < marks.length; i++) {
        if (marks[i] < 50) {
            return "Fail";
        }
    }

    return "Pass";
}



// Function to find highest mark
function findHighestMark(marks) {
    if (marks.length === 0) {
        return null;
    }



    let highest = marks[0];

    for (let i = 1; i < marks.length; i++) {
        if (marks[i] > highest) {
            highest = marks[i];
        }
    }

    return highest;
}



// Function to find lowest mark
function findLowestMark(marks) {
    if (marks.length === 0) {
        return null;
    }

    let lowest = marks[0];

    for (let i = 1; i < marks.length; i++) {
        if (marks[i] < lowest) {
            lowest = marks[i];
        }
    }

    return lowest;
}



// Function to count passed subjects
function countPassedSubjects(marks) {
    let count = 0;

    for (let i = 0; i < marks.length; i++) {
        if (marks[i] >= 50) {
            count++;
        }
    }

    return count;
}



// Function to count failed subjects
function countFailedSubjects(marks) {
    let count = 0;

    for (let i = 0; i < marks.length; i++) {
        if (marks[i] < 50) {
            count++;
        }
    }

    return count;
}



// Calling functions
const total = calculateTotal(marks);
const average = calculateAverage(total, marks.length);
const grade = calculateGrade(average);
const result = checkResult(marks);
const highestMark = findHighestMark(marks);
const lowestMark = findLowestMark(marks);
const passedSubjects = countPassedSubjects(marks);
const failedSubjects = countFailedSubjects(marks);



// Output
console.log("Student Name:", studentName);
console.log("Marks:", marks);
console.log("Total Marks:", total);
console.log("Average:", average);
console.log("Grade:", grade);
console.log("Result:", result);
console.log("Highest Mark:", highestMark);
console.log("Lowest Mark:", lowestMark);
console.log("Passed Subjects:", passedSubjects);
console.log("Failed Subjects:", failedSubjects);
