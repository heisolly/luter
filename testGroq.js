import dotenv from 'dotenv';
dotenv.config();

import { researchSyllabusOnline } from './src/groqClient.js';

async function test() {
  const searchResults = {
    results: [
      {
        title: "Unilag CS Syllabus",
        url: "https://unilag.edu.ng/cs",
        content: "The first semester courses are CSC101 Introduction to Computing, CSC103 Computer Hardware, MTH101 Algebra, and GST101 General Studies."
      }
    ],
    answer: "I found the courses."
  };

  try {
    const res = await researchSyllabusOnline({
      university: "University of Lagos",
      department: "Computer Science",
      level: "100L",
      semester: "1st",
      searchResults
    });
    console.log("RESULT:", res);
  } catch(e) {
    console.error("ERROR:", e);
  }
}

test();
