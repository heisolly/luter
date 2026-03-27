export const curriculum_db = {
  "Computer Science": {
    "100": {
      "1st": [
        { code: "CSC 101", name: "Introduction to Computer Science", credits: 3 },
        { code: "MTH 101", name: "Elementary Mathematics I", credits: 3 },
        { code: "PHY 101", name: "General Physics I", credits: 3 },
        { code: "CHM 101", name: "General Chemistry I", credits: 3 },
        { code: "BIO 101", name: "General Biology I", credits: 3 },
        { code: "GST 111", name: "Communication in English", credits: 2 },
        { code: "GST 113", name: "Nigerian Peoples and Culture", credits: 2 },
        { code: "STA 111", name: "Introduction to Statistics", credits: 3 }
      ],
      "2nd": [
        { code: "CSC 102", name: "Introduction to Problem Solving", credits: 3 },
        { code: "MTH 102", name: "Elementary Mathematics II", credits: 3 },
        { code: "PHY 102", name: "General Physics II", credits: 3 },
        { code: "CHM 102", name: "General Chemistry II", credits: 3 },
        { code: "BIO 102", name: "General Biology II", credits: 3 },
        { code: "GST 112", name: "Logic, Philosophy and Human Existence", credits: 2 },
        { code: "GST 122", name: "Communication in English II", credits: 2 },
        { code: "STA 112", name: "Probability Theory", credits: 3 },
        { code: "CSC 120", name: "Computer Hardware Fundamentals", credits: 2 },
        { code: "CSC 130", name: "Digital Logic Design I", credits: 2 },
        { code: "CSC 140", name: "Software Engineering Basics", credits: 2 },
        { code: "CSC 150", name: "Introduction to Web Technologies", credits: 2 },
        { code: "CSC 160", name: "IT Ethics & Professionalism", credits: 1 }
      ]
    },
    "200": {
      "1st": [
        { code: "CSC 201", name: "Computer Programming I", credits: 3 },
        { code: "CSC 203", name: "Discrete Structures", credits: 3 },
        { code: "CSC 205", name: "Operating Systems I", credits: 3 }
      ],
      "2nd": [
        { code: "CSC 202", name: "Computer Programming II", credits: 3 },
        { code: "CSC 204", name: "Data Structures and Algorithms", credits: 3 },
        { code: "CSC 206", name: "Database Design", credits: 3 },
        { code: "CSC 208", name: "Systems Analysis", credits: 3 }
      ]
    }
  },
  "Economics": {
    "100": {
      "1st": [
        { code: "ECO 101", name: "Principles of Microeconomics", credits: 3 },
        { code: "MTH 105", name: "Mathematics for Economics I", credits: 3 },
        { code: "BUS 101", name: "Introduction to Business", credits: 3 },
        { code: "ACC 101", name: "Principles of Accounting I", credits: 3 },
        { code: "GST 111", name: "Communication in English I", credits: 2 },
        { code: "GST 113", name: "Nigerian Peoples and Culture", credits: 2 }
      ],
      "2nd": [
        { code: "ECO 102", name: "Principles of Macroeconomics", credits: 3 },
        { code: "MTH 106", name: "Mathematics for Economics II", credits: 3 },
        { code: "BUS 102", name: "Introduction to Business II", credits: 3 },
        { code: "ACC 102", name: "Principles of Accounting II", credits: 3 },
        { code: "GST 112", name: "Logic, Philosophy and Human Existence", credits: 2 },
        { code: "GST 122", name: "Communication in English II", credits: 2 }
      ]
    }
  }
}

export const getSubjects = (programme, level, semester) => {
  if (curriculum_db[programme] && curriculum_db[programme][level] && curriculum_db[programme][level][semester]) {
    return curriculum_db[programme][level][semester];
  }
  // Generic Fallback if course not explicitly found
  return [
    { code: `${programme.slice(0,3).toUpperCase()} ${level.charAt(0)}01`, name: `Introduction to ${programme} I`, credits: 3 },
    { code: `${programme.slice(0,3).toUpperCase()} ${level.charAt(0)}02`, name: `Core ${programme} Fundamentals`, credits: 3 },
    { code: `${programme.slice(0,3).toUpperCase()} ${level.charAt(0)}03`, name: `Advanced ${programme} Theory`, credits: 3 },
    { code: "GST 111", name: "General Studies", credits: 2 },
  ];
}
