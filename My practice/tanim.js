
const student = {
    name: "Tanim",
    age: 23,
    marks: 85
};

console.log("Student Name:", student.name);
console.log("Age:", student.age);

if (student.marks >= 80) {
    console.log("Grade: A+");
} else if (student.marks >= 70) {
    console.log("Grade: A");
} else if (student.marks >= 60) {
    console.log("Grade: A-");
} else if (student.marks >= 50) {
    console.log("Grade: B");
} else {
    console.log("Grade: Fail");
}
