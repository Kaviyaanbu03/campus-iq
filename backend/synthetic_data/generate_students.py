"""
CampusIQ X - Synthetic Student Dataset Generator
--------------------------------------------------
Generates a realistic synthetic dataset of students for the
CampusIQ X Academic Intelligence Platform.

Run:
    python generate_students.py

Output:
    students.json  (in this directory)
"""

import json
import random
from pathlib import Path

random.seed(42)

DEPARTMENTS = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil", "AI & Data Science"]

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Ishaan", "Rohan", "Kabir", "Aryan", "Dev",
    "Ananya", "Diya", "Saanvi", "Myra", "Aadhya", "Kiara", "Priya", "Riya",
    "Arjun", "Sahil", "Karan", "Nikhil", "Sneha", "Pooja", "Meera", "Tanya",
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Gupta", "Reddy", "Iyer", "Nair", "Singh",
    "Mehta", "Kapoor", "Joshi", "Chopra", "Rao", "Pillai", "Desai", "Malhotra",
]

SUBJECTS_BY_DEPT = {
    "Computer Science": ["Data Structures", "Operating Systems", "DBMS", "Computer Networks", "Software Engineering"],
    "Information Technology": ["Web Technologies", "Cloud Computing", "DBMS", "Computer Networks", "Cybersecurity"],
    "Electronics": ["Digital Electronics", "Signals & Systems", "Microprocessors", "VLSI Design", "Communication Systems"],
    "Mechanical": ["Thermodynamics", "Fluid Mechanics", "Machine Design", "Manufacturing Processes", "Strength of Materials"],
    "Civil": ["Structural Analysis", "Geotechnical Engineering", "Surveying", "Concrete Technology", "Hydraulics"],
    "AI & Data Science": ["Machine Learning", "Deep Learning", "Statistics for AI", "Data Mining", "NLP"],
}

SKILLS_POOL = [
    "Python", "Java", "C++", "JavaScript", "React", "Node.js", "SQL",
    "Machine Learning", "Deep Learning", "AWS", "Azure", "Docker",
    "Kubernetes", "Git", "REST APIs", "Data Structures", "Algorithms",
    "TensorFlow", "PyTorch", "Power BI", "Excel", "Communication",
]

CERTIFICATIONS_POOL = [
    "Microsoft Azure Fundamentals (AZ-900)",
    "Microsoft Azure AI Fundamentals (AI-900)",
    "AWS Certified Cloud Practitioner",
    "Google Data Analytics Certificate",
    "Oracle Java SE Certified",
    "Coursera Machine Learning Specialization",
    "Cisco CCNA",
    "HackerRank Problem Solving (Intermediate)",
]

RISK_LEVELS = ["Low", "Medium", "High"]
PLACEMENT_STATUS = ["Placed", "In Progress", "Not Started"]


def generate_student(student_id: int) -> dict:
    dept = random.choice(DEPARTMENTS)
    subjects = SUBJECTS_BY_DEPT[dept]

    attendance = round(random.uniform(55, 99), 1)
    internal_marks = {s: random.randint(10, 30) for s in subjects}
    external_marks = {s: random.randint(30, 100) for s in subjects}

    total_marks = sum(internal_marks.values()) + sum(external_marks.values())
    max_marks = len(subjects) * (30 + 100)
    cgpa = round((total_marks / max_marks) * 10, 2)

    weak_subjects = [
        s for s in subjects
        if (internal_marks[s] + external_marks[s]) / 130 < 0.5
    ]

    study_hours = round(random.uniform(1, 8), 1)

    # Simple heuristic risk scoring (used as ground-truth synthetic label;
    # AnalysisAgent will independently compute its own risk via reasoning)
    risk_score = 0
    if attendance < 75:
        risk_score += 1
    if cgpa < 6.0:
        risk_score += 1
    if len(weak_subjects) >= 2:
        risk_score += 1
    if study_hours < 2:
        risk_score += 1

    if risk_score >= 3:
        risk_level = "High"
    elif risk_score >= 1:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    skills = random.sample(SKILLS_POOL, k=random.randint(4, 9))
    certifications = random.sample(CERTIFICATIONS_POOL, k=random.randint(0, 3))

    resume_score = round(random.uniform(40, 95), 1)
    interview_readiness = round(random.uniform(30, 95), 1)

    placement_status = random.choices(
        PLACEMENT_STATUS, weights=[0.25, 0.45, 0.30]
    )[0]

    name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

    return {
        "student_id": f"CIQ{student_id:04d}",
        "name": name,
        "department": dept,
        "semester": random.randint(1, 8),
        "attendance_percent": attendance,
        "subjects": subjects,
        "internal_marks": internal_marks,
        "external_marks": external_marks,
        "cgpa": cgpa,
        "skills": skills,
        "certifications": certifications,
        "placement_status": placement_status,
        "interview_readiness": interview_readiness,
        "study_hours_per_day": study_hours,
        "risk_level": risk_level,
        "weak_subjects": weak_subjects,
        "resume_score": resume_score,
    }


def generate_dataset(count: int = 40) -> list:
    return [generate_student(i + 1) for i in range(count)]


if __name__ == "__main__":
    dataset = generate_dataset(40)
    out_path = Path(__file__).parent / "students.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)
    print(f"Generated {len(dataset)} students -> {out_path}")
