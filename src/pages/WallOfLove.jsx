import React, { useState, useEffect } from "react";

/* ─── Platform icons ─── */
const IconX = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#111">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const IconIG = () => (
  <svg width="15" height="15" viewBox="0 0 24 24">
    <defs>
      <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fd5949"/>
        <stop offset="50%" stopColor="#d6249f"/>
        <stop offset="100%" stopColor="#285AEB"/>
      </linearGradient>
    </defs>
    <path fill="url(#ig)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);
const IconFB = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

/* ─── Stars ─── */
const Stars = ({ count = 5 }) => (
  <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
    {Array.from({ length: count }).map((_, i) => (
      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24">
        <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
      </svg>
    ))}
  </div>
);

/* ─── Card palettes ─── */
const PALETTES = [
  { bg: "#F3E8FF", border: "rgba(151,24,251,0.12)",  glow: "rgba(151,24,251,0.22)"  },
  { bg: "#EFF6FF", border: "rgba(113,128,254,0.14)", glow: "rgba(113,128,254,0.24)" },
  { bg: "#FDF2F8", border: "rgba(236,72,153,0.12)",  glow: "rgba(236,72,153,0.22)"  },
  { bg: "#FEFCE8", border: "rgba(234,179,8,0.14)",   glow: "rgba(234,179,8,0.22)"   },
  { bg: "#F0FDF4", border: "rgba(34,197,94,0.12)",   glow: "rgba(34,197,94,0.22)"   },
  { bg: "#FFF7ED", border: "rgba(249,115,22,0.12)",  glow: "rgba(249,115,22,0.22)"  },
];

/* ─── Data ─── */
const cards = [
  { name:"Arjun",   handle:"arjun_learns",  seed:"arjun",    platform:"x",  text:"My highest GCSE subjects were the ones I used Luter for. FR is the only way I learn",                                  time:"08:10 PM · 7d",  likes:99   },
  { name:"Georgia", handle:"georgia_study", seed:"georgia",  platform:"ig", text:"Luter SAVED my science grades, went from a 4-3 to 7-7 in weeks!",                                                      time:"09:45 AM · 1d",  likes:33   },
  { name:"Melinoe", handle:"melinoe99",     seed:"melinoe",  platform:"fb", text:"What a lifesaver — Luter is incredible",                                                                                time:"11:20 AM · 1d",  likes:55   },
  { name:"Isla",    handle:"isla_student",  seed:"isla",     platform:"x",  text:"I'm actually obsessed with Luter... I never enjoyed studying before",                                                    time:"02:15 PM · 8d",  likes:201  },
  { name:"JJ",      handle:"jj_studies",   seed:"jj",       platform:"ig", text:"I studied with Luter and got 100% on my social studies test. Y'all need to download this!",                             time:"04:30 PM · 1d",  likes:88   },
  { name:"Cheese",  handle:"cheese_master",seed:"cheese",   platform:"fb", text:"LUTER IS THE BEST — if you need straight A's, get it now. I love you Luter!",                                          time:"06:12 PM · 10d", likes:95   },
  { name:"Penny",   handle:"penny_prep",   seed:"penny",    platform:"ig", text:"Luter is honestly saving my life",                                                                                      time:"10:05 AM · 4d",  likes:828  },
  { name:"Z",       handle:"z_level",      seed:"zeppelin", platform:"x",  text:"To be honest Luter actually helped me and now my grades are going up.",                                                 time:"01:50 PM · 4d",  likes:902  },
  { name:"FF1",     handle:"ff1_student",  seed:"ff1",      platform:"fb", text:"Coming from a year 11 student — I use Luter all the time and recommend it to all my friends. Amazing!",                time:"07:33 PM · 14d", likes:993  },
  { name:"Austin",  handle:"austin_ace",   seed:"austin",   platform:"ig", text:"Honestly such a lifesaver. Used Luter before an exam and I feel so much better about my grades",                       time:"03:45 PM · 8d",  likes:101  },
  { name:"Chakra",  handle:"chakra5mint",  seed:"chakra",   platform:"x",  text:"Got an A+ in biology with Luter!",                                                                                     time:"08:22 AM · 6d",  likes:331  },
  { name:"Imran",   handle:"imran_5",      seed:"imran",    platform:"ig", text:"I've been waiting for an app like Luter for years. It's life changing",                                                 time:"12:10 PM · 20d", likes:144  },
  { name:"Ingrid",  handle:"ingridious",   seed:"ingrid",   platform:"fb", text:"I'm really enjoying Luter — so many cool features. I've never memorised so quickly.",                                  time:"05:55 PM · 2d",  likes:643  },
  { name:"Sophie",  handle:"sophie_k",     seed:"sophiek",  platform:"x",  text:"Luter made revision actually enjoyable for the first time ever. I can't believe how much I've retained",               time:"09:30 AM · 3d",  likes:412  },
  { name:"Tom",     handle:"tomh_studies", seed:"tomh",     platform:"ig", text:"Been using Luter for two weeks and my teacher noticed a difference. She asked what I was doing differently!",          time:"02:40 PM · 5d",  likes:287  },
  { name:"Riya",    handle:"riya_revision",seed:"riya",     platform:"x",  text:"Luter is the reason I passed my maths mock. I was failing before and now I'm getting 80s. Thank you so much",          time:"06:15 PM · 2d",  likes:519  },
  { name:"Oliver",  handle:"oliverm",      seed:"oliverm",  platform:"fb", text:"Never thought I'd actually look forward to studying. Luter changed that completely",                                    time:"11:05 AM · 6d",  likes:374  },
  { name:"Zara",    handle:"zara_t",       seed:"zarat",    platform:"ig", text:"My whole friend group uses Luter now. We literally have a study server dedicated to it",                                time:"04:50 PM · 1d",  likes:668  },
  { name:"Benny",   handle:"bennyw",       seed:"bennyw",   platform:"x",  text:"Got a B in chemistry when I was predicted a D. Luter is the only thing I did differently",                             time:"08:25 PM · 9d",  likes:456  },
  { name:"Priya",   handle:"priya_learns", seed:"priya",    platform:"fb", text:"I recommended Luter to my whole class. My teacher even wants to integrate it into lessons",                            time:"10:10 AM · 4d",  likes:731  },
  { name:"Sam",     handle:"sam_ace",      seed:"samace",   platform:"ig", text:"Luter makes hard topics feel simple. I finally understand organic chemistry and I owe it all to this app",             time:"03:20 PM · 7d",  likes:209  },
  { name:"Layla",   handle:"layla_prep",   seed:"layla",    platform:"x",  text:"Genuinely can't imagine exam season without Luter. It's the best revision tool I've ever used",                        time:"07:45 PM · 2d",  likes:883  },
  { name:"Naomi",   handle:"naomic",       seed:"naomic",   platform:"fb", text:"Luter turned my study sessions from 20 minutes to 2 hours because I actually enjoy it now",                            time:"01:15 PM · 5d",  likes:547  },
  { name:"Kieran",  handle:"kieranb",      seed:"kieranb",  platform:"ig", text:"My predicted grade went from C to A after using Luter consistently. Absolutely unreal",                                time:"09:55 AM · 11d", likes:614  },
  { name:"Fatima",  handle:"fatima_focus", seed:"fatima",   platform:"x",  text:"Luter is the only app that actually keeps me focused. No distractions, just learning",                                 time:"05:30 PM · 3d",  likes:328  },
  { name:"Ellie",   handle:"ellierose",    seed:"ellierose",platform:"fb", text:"Started using Luter a month ago and I actually enjoy studying now — never thought I'd say that",                       time:"12:40 PM · 8d",  likes:492  },
  { name:"Jayden",  handle:"jayden_grades",seed:"jayden",   platform:"ig", text:"Luter is fire. My GPA literally jumped a whole point in one semester",                                                 time:"08:05 PM · 2d",  likes:761  },
  { name:"Mia",     handle:"miaw_smart",   seed:"miaw",     platform:"x",  text:"My parents couldn't believe my report card. Luter is the reason. So grateful this app exists",                         time:"04:15 PM · 6d",  likes:1024 },
  { name:"Amara O.", handle:"amarao89", seed:"amarao", platform:"ig", stars:3, text:"Luter completely changed how I see algebra. The drag-and-drop exercises make it feel like a game. I went from failing to top of my class in two months!", time:"05:40 AM · 11d", likes:444 },
  { name:"Kofi M.", handle:"kofim26", seed:"kofim", platform:"x", stars:3, text:"I was so scared of calculus but Luter breaks it down into tiny steps. The visual explanations are brilliant — I finally understand derivatives!", time:"04:28 AM · 14d", likes:731 },
  { name:"Sophie L.", handle:"sophiel46", seed:"sophiel", platform:"ig", stars:4, text:"My daughter went from dreading math homework to asking to use Luter after dinner. That is a miracle in our house. Worth every penny.", time:"03:48 AM · 8d", likes:738 },
  { name:"Yusuf A.", handle:"yusufa31", seed:"yusufa", platform:"ig", stars:3, text:"The geometry module is incredible. Seeing shapes transform on screen made everything click. My exam score jumped 40 points!", time:"04:53 PM · 14d", likes:635 },
  { name:"Priya S.", handle:"priyas48", seed:"priyas", platform:"ig", stars:3, text:"I recommend Luter to all my students. The interactive exercises perfectly reinforce what I teach in class. The expand-and-simplify module is especially well done.", time:"12:42 AM · 12d", likes:388 },
  { name:"Ethan B.", handle:"ethanb80", seed:"ethanb", platform:"fb", stars:3, text:"Fractions used to make me cry. Luter's visual approach with real examples is so much better than textbooks. I actually enjoy doing them now.", time:"04:15 AM · 15d", likes:209 },
  { name:"Fatima H.", handle:"fatimah92", seed:"fatimah", platform:"fb", stars:3, text:"The calculus practice on Luter helped me ace my A-level mock. The step-by-step feedback tells you exactly where you went wrong.", time:"01:20 PM · 20d", likes:555 },
  { name:"Liam C.", handle:"liamc60", seed:"liamc", platform:"fb", stars:5, text:"Simple, clean, and effective. My son does 20 minutes on Luter every evening and his confidence in math has skyrocketed. Highly recommend!", time:"11:24 AM · 16d", likes:899 },
  { name:"Zara N.", handle:"zaran75", seed:"zaran", platform:"ig", stars:3, text:"I love how Luter makes fractions look like puzzles. Every lesson feels like a mini game and before I know it I've learned something new.", time:"11:19 PM · 9d", likes:946 },
  { name:"Daniel K.", handle:"danielk25", seed:"danielk", platform:"ig", stars:5, text:"Luter's algebra section is the best resource I've found online. The explanations are short and clear and I can practice instantly after each one.", time:"10:35 PM · 17d", likes:644 },
  { name:"Mei T.", handle:"meit29", seed:"meit", platform:"ig", stars:3, text:"As a teacher I am always looking for quality resources. Luter stands out because it focuses on understanding, not just memorising formulas. My students love it.", time:"06:37 PM · 13d", likes:631 },
  { name:"Ola F.", handle:"olaf65", seed:"olaf", platform:"ig", stars:5, text:"Geometry proofs seemed impossible until I used Luter. The platform walks you through each step and the diagrams are so clean and easy to follow.", time:"02:16 PM · 12d", likes:143 },
  { name:"Isaac W.", handle:"isaacw62", seed:"isaacw", platform:"ig", stars:5, text:"The way Luter teaches factorisation is genius. I tried three other apps and none of them came close. This one actually makes it make sense.", time:"03:37 AM · 9d", likes:468 },
  { name:"Aisha B.", handle:"aishab36", seed:"aishab", platform:"x", stars:3, text:"Luter is the first ed-tech app I've seen that my kids use voluntarily. They compete with each other to get the highest scores. Learning disguised as fun!", time:"09:07 PM · 16d", likes:567 },
  { name:"Noah R.", handle:"noahr73", seed:"noahr", platform:"fb", stars:5, text:"I used to mix up numerators and denominators all the time. After a week on Luter I don't make that mistake anymore. The visuals really help.", time:"10:46 AM · 1d", likes:667 },
  { name:"Clara V.", handle:"clarav11", seed:"clarav", platform:"x", stars:5, text:"Integration by parts is notoriously hard but Luter's guided practice made it manageable. Each hint nudges you in the right direction without giving the answer away.", time:"01:10 AM · 7d", likes:873 },
  { name:"Tunde E.", handle:"tundee48", seed:"tundee", platform:"x", stars:4, text:"I recommended Luter to five of my classmates and they all thank me now. Best math platform out there, full stop.", time:"06:44 PM · 4d", likes:171 },
  { name:"Emma P.", handle:"emmap23", seed:"emmap", platform:"x", stars:4, text:"As a parent who struggled with math myself, I was nervous helping my son. Luter gives him independence and gives me peace of mind. Brilliant app.", time:"11:24 PM · 17d", likes:249 },
  { name:"Kwame J.", handle:"kwamej87", seed:"kwamej", platform:"fb", stars:4, text:"The circle theorems section is laid out perfectly. Luter uses colour and animation to show why each theorem works. I finally stopped guessing and started knowing.", time:"05:37 PM · 3d", likes:126 },
  { name:"Sara M.", handle:"saram94", seed:"saram", platform:"ig", stars:5, text:"I set Luter as homework for my Year 10 class and engagement went through the roof. The progress dashboard helps me see exactly who needs extra support.", time:"12:25 PM · 13d", likes:616 },
  { name:"Ben H.", handle:"benh93", seed:"benh", platform:"x", stars:4, text:"My teacher uses Luter in class and it is so much better than worksheets. The whole class pays attention when the interactive exercises come up on the board.", time:"01:07 AM · 18d", likes:374 },
  { name:"Nadia L.", handle:"nadial81", seed:"nadial", platform:"fb", stars:3, text:"Luter helped me go from a D to an A in Further Math. The practice questions are perfectly pitched and there are so many of them.", time:"02:36 PM · 17d", likes:490 },
  { name:"James O.", handle:"jameso39", seed:"jameso", platform:"x", stars:5, text:"I do 15 minutes on Luter before school every day. It is the best warm-up for math class and my teacher has noticed the improvement.", time:"02:00 PM · 16d", likes:815 },
  { name:"Grace T.", handle:"gracet61", seed:"gracet", platform:"ig", stars:4, text:"My daughter has dyslexia and finds text-heavy resources overwhelming. Luter's visual-first approach is a game changer for her. She's so much more confident now.", time:"01:54 AM · 9d", likes:763 },
  { name:"Emre D.", handle:"emred39", seed:"emred", platform:"ig", stars:5, text:"Used Luter to prepare for university entrance exams. The calculus content goes deep enough to challenge me while remaining approachable. Got into my first choice!", time:"12:05 PM · 19d", likes:661 },
  { name:"Lily B.", handle:"lilyb26", seed:"lilyb", platform:"x", stars:4, text:"My maths tutor recommended Luter and it has been amazing. The fractions module especially — I do one lesson a day and it really adds up.", time:"11:46 AM · 11d", likes:133 },
  { name:"Chidi A.", handle:"chidia89", seed:"chidia", platform:"ig", stars:5, text:"Never understood why angles in a triangle add to 180° until Luter showed me with an animation. Now I get it and I can explain it to others.", time:"01:50 PM · 16d", likes:108 },
  { name:"Hannah K.", handle:"hannahk29", seed:"hannahk", platform:"x", stars:3, text:"Luter is one of very few platforms that genuinely prioritises conceptual understanding. My students don't just get the right answer — they understand why it's right.", time:"02:11 AM · 1d", likes:635 },
  { name:"Marcus F.", handle:"marcusf52", seed:"marcusf", platform:"ig", stars:5, text:"The expand and simplify exercises are so well designed. You have to drag the right terms into place and it really helps the process stick in your memory.", time:"11:54 AM · 8d", likes:407 },
  { name:"Amelia S.", handle:"amelias18", seed:"amelias", platform:"x", stars:3, text:"My son is homeschooled and Luter is our go-to for math. The structured lessons give me confidence that we're covering everything properly. Truly excellent.", time:"09:47 PM · 8d", likes:890 },
  { name:"Ravi N.", handle:"ravin17", seed:"ravin", platform:"x", stars:5, text:"Luter made me realise that calculus is actually beautiful. Once you understand the logic the calculations become natural. I actually look forward to studying it now.", time:"09:27 AM · 7d", likes:97 },
  { name:"Chloe W.", handle:"chloew23", seed:"chloew", platform:"x", stars:3, text:"The fraction wall visual on Luter is the best explanation I have seen anywhere. My teacher didn't explain it half as well! Very easy to understand.", time:"03:30 PM · 18d", likes:491 },
  { name:"Sami R.", handle:"samir16", seed:"samir", platform:"x", stars:5, text:"I struggled with trigonometry for ages. Luter breaks sin, cos and tan down with interactive triangles that you can drag and resize. Total lightbulb moment.", time:"05:33 AM · 17d", likes:327 },
  { name:"Olivia C.", handle:"oliviac74", seed:"oliviac", platform:"x", stars:3, text:"I use Luter's exercises as starters for my lessons. Students arrive engaged and ready to learn because they've already had a taste of the topic on their phones.", time:"12:24 PM · 14d", likes:902 },
  { name:"Finn M.", handle:"finnm35", seed:"finnm", platform:"ig", stars:3, text:"Luter's simultaneous equations module is excellent. The graphical representation alongside the algebraic method really helps you see what is happening. Highly recommend.", time:"09:51 AM · 5d", likes:747 },
  { name:"Adaeze U.", handle:"adaezeu80", seed:"adaezeu", platform:"x", stars:4, text:"Three of my children use Luter and all three have improved their grades. The youngest is 8 and she uses it independently. That says everything about how intuitive it is.", time:"09:51 AM · 17d", likes:479 },
  { name:"Tom G.", handle:"tomg87", seed:"tomg", platform:"ig", stars:5, text:"The instant feedback is what makes Luter special. On paper homework you wait days to find out you got something wrong. On Luter you find out immediately and learn why.", time:"12:11 PM · 4d", likes:893 },
  { name:"Isabel F.", handle:"isabelf56", seed:"isabelf", platform:"x", stars:4, text:"I did a whole Luter calculus module in one sitting because I couldn't stop. It is genuinely engaging in a way that most textbooks and videos are not.", time:"08:57 AM · 3d", likes:742 },
  { name:"Jamal T.", handle:"jamalt92", seed:"jamalt", platform:"fb", stars:4, text:"Luter explained equivalent fractions to me in 5 minutes. I had been confused for two years. Sometimes all it takes is a different explanation and Luter nails it.", time:"03:25 AM · 6d", likes:616 },
  { name:"Leila H.", handle:"leilah72", seed:"leilah", platform:"x", stars:3, text:"I bought a Luter subscription for my daughter as a birthday present and it is the best gift I have given her educationally. She's already improved her test score by 25%.", time:"03:40 PM · 18d", likes:478 },
  { name:"Oscar P.", handle:"oscarp12", seed:"oscarp", platform:"ig", stars:4, text:"The Pythagoras section on Luter is so clear. You can see the squares on each side of the triangle and it makes the theorem completely obvious.", time:"04:42 PM · 1d", likes:430 },
  { name:"Nneka I.", handle:"nnekai67", seed:"nnekai", platform:"x", stars:5, text:"Luter's approach aligns beautifully with modern teaching methods. It builds number sense and reasoning rather than mechanical repetition. A genuine asset to any classroom.", time:"10:44 PM · 14d", likes:181 },
  { name:"Luke S.", handle:"lukes90", seed:"lukes", platform:"x", stars:3, text:"I used Luter every day for three months before my A-level exams. Went in feeling prepared and came out with an A*. Cannot recommend it enough.", time:"02:09 AM · 17d", likes:713 },
  { name:"Aria K.", handle:"ariak87", seed:"ariak", platform:"fb", stars:3, text:"My favourite thing about Luter is the sparkle badge you get when you finish a module. It sounds small but it really makes you want to keep going!", time:"06:45 PM · 10d", likes:446 },
  { name:"Demi O.", handle:"demio19", seed:"demio", platform:"x", stars:5, text:"Luter helped me understand that algebra is just a language for describing patterns. Once I saw it that way everything became easier. The lessons are so well sequenced.", time:"08:57 PM · 18d", likes:710 },
  { name:"Sam W.", handle:"samw33", seed:"samw", platform:"x", stars:3, text:"Clean interface, no ads, excellent content. Luter is exactly what I was looking for — a focused math tool that doesn't distract my child with games and pop-ups.", time:"02:11 AM · 5d", likes:709 },
  { name:"Ruby A.", handle:"rubya25", seed:"rubya", platform:"fb", stars:5, text:"3D geometry finally makes sense to me thanks to Luter. The rotating shape feature is amazing — being able to spin the object around helps so much.", time:"01:36 PM · 10d", likes:424 },
  { name:"Eli Z.", handle:"eliz55", seed:"eliz", platform:"fb", stars:3, text:"I started using Luter when my class moved onto differentiation. The platform introduced it so gently with small, manageable steps. My confidence grew lesson by lesson.", time:"11:14 AM · 10d", likes:935 },
  { name:"Tasha R.", handle:"tashar26", seed:"tashar", platform:"ig", stars:4, text:"The variety of question types on Luter keeps students on their toes. Multiple choice, drag-and-drop, fill-in — each format tests understanding from a different angle. Superb.", time:"08:41 AM · 9d", likes:702 },
  { name:"Felix N.", handle:"felixn58", seed:"felixn", platform:"ig", stars:3, text:"Luter is the reason I stopped hating math. I used to dread fractions but now I actually volunteer to answer questions in class. Life-changing is not too strong a word.", time:"10:59 AM · 16d", likes:586 },
];

const avatarUrl  = (seed) => `https://api.dicebear.com/8.x/micah/svg?seed=${seed}&backgroundColor=transparent`;
const platformIcon = (p)  => p === "ig" ? <IconIG /> : p === "fb" ? <IconFB /> : <IconX />;
const fmtLikes   = (n)    => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

/* ════════════════════════════════════
   MODAL — shown when a card is clicked
   ════════════════════════════════════ */
const Modal = ({ card, paletteIndex, onClose }) => {
  const pal = PALETTES[paletteIndex % PALETTES.length];

  /* Close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,10,30,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
        animation: "wol-fade-in 0.22s ease",
      }}
    >
      {/* Card panel — stop click propagation so clicking inside doesn't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: pal.bg,
          border: `2px solid ${pal.glow}`,
          borderRadius: 28,
          padding: "36px 40px",
          maxWidth: 480,
          width: "100%",
          boxShadow: `0 40px 80px -16px ${pal.glow}, 0 0 0 1px rgba(255,255,255,0.6) inset`,
          animation: "wol-pop-in 0.30s cubic-bezier(0.175,0.885,0.32,1.275)",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(0,0,0,0.06)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
          <div style={{
            width:64, height:64, borderRadius:"50%",
            background:"rgba(255,255,255,0.8)",
            boxShadow:"0 4px 12px rgba(0,0,0,0.08)",
            overflow:"hidden", flexShrink:0,
          }}>
            <img src={avatarUrl(card.seed)} alt={card.name} width={64} height={64} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#111827" }}>{card.name}</div>
            <div style={{ fontSize:14, color:"#6B7280", marginTop:3 }}>@{card.handle}</div>
          </div>
          <div style={{
            width:36, height:36, borderRadius:"50%",
            background:"rgba(255,255,255,0.9)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 1px 4px rgba(0,0,0,0.08)",
          }}>
            {platformIcon(card.platform)}
          </div>
        </div>

        {/* Stars */}
        <div style={{ display:"flex", gap:4, marginBottom:18 }}>
          {Array.from({ length:5 }).map((_,i) => (
            <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#FBBF24">
              <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
            </svg>
          ))}
        </div>

        {/* Quote */}
        <p style={{
          fontSize:17, color:"#1F2937", lineHeight:1.7,
          fontWeight:500, marginBottom:24,
          fontFamily:"'Outfit', sans-serif",
        }}>
          "{card.text}"
        </p>

        {/* Footer */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          fontSize:13, color:"#9CA3AF",
          paddingTop:16, borderTop:"1px solid rgba(0,0,0,0.06)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#F43F5E">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span style={{ color:"#4B5563", fontWeight:700, fontSize:14 }}>{fmtLikes(card.likes)}</span>
          </div>
          <span>{card.time}</span>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════
   SINGLE SCROLLING CARD
   ════════════════════════ */
const Card = ({ card, paletteIndex, onClick }) => {
  const pal = PALETTES[paletteIndex % PALETTES.length];
  return (
    <div
      onClick={onClick}
      className="wol-card"
      style={{
        background: pal.bg,
        border: `1.5px solid ${pal.border}`,
        borderRadius: 32,
        padding: "32px 36px",
        width: 420,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        cursor: "pointer",
        transition: "transform 0.2s, filter 0.2s",
      }}
    >
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{
            width:56, height:56, borderRadius:"50%",
            background:"rgba(255,255,255,0.7)",
            boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
            overflow:"hidden", flexShrink:0,
          }}>
            <img src={avatarUrl(card.seed)} alt={card.name} width={56} height={56} loading="lazy"/>
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:"#111827" }}>{card.name}</div>
            <div style={{ fontSize:14, color:"#6B7280", marginTop:2 }}>@{card.handle}</div>
          </div>
        </div>
        <div style={{
          width:36, height:36, borderRadius:"50%",
          background:"rgba(255,255,255,0.9)",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 1px 4px rgba(0,0,0,0.08)", flexShrink:0,
        }}>
          {platformIcon(card.platform)}
        </div>
      </div>

      <Stars count={card.stars || 5} />

      <p style={{
        fontSize:16, color:"#374151", lineHeight:1.6,
        fontWeight:500, marginBottom:24, flexGrow:1,
        fontFamily:"'Outfit', sans-serif",
      }}>
        "{card.text}"
      </p>

      {/* Footer */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        fontSize:13, color:"#9CA3AF",
        paddingTop:16, borderTop:"1px solid rgba(0,0,0,0.05)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#F43F5E">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span style={{ color:"#4B5563", fontWeight:700 }}>{fmtLikes(card.likes)}</span>
        </div>
        <span>{card.time}</span>
      </div>
    </div>
  );
};

/* ─── Scroll row — always running, never paused ─── */
const Row = ({ items, direction, speed, onCardClick, paletteOffset }) => {
  const doubled = [...items, ...items];
  const anim = direction === "left" ? "wol-left" : "wol-right";
  return (
    <div style={{ overflow:"hidden", padding:"16px 0" }}>
      <div style={{
        display:"flex", gap:24, width:"max-content",
        animation:`${anim} ${speed}s linear infinite`,
        paddingLeft:12,
      }}>
        {doubled.map((card, i) => (
          <Card
            key={i}
            card={card}
            paletteIndex={(i % items.length) + paletteOffset}
            onClick={() => onCardClick(card, (i % items.length) + paletteOffset)}
          />
        ))}
      </div>
    </div>
  );
};

/* ════════════════
   PAGE
   ════════════════ */
export default function WallOfLove({ transparentBg = false }) {
  const [selected, setSelected] = useState(null); // { card, paletteIndex }

  const third = Math.ceil(cards.length / 3);
  const row1 = cards.slice(0, third);
  const row2 = cards.slice(third, third * 2);
  const row3 = cards.slice(third * 2);

  return (
    <>
      <style>{`
        @keyframes wol-left    { 0%{transform:translateX(0)}    100%{transform:translateX(-50%)} }
        @keyframes wol-right   { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)}   }
        @keyframes wol-fade-in { from{opacity:0} to{opacity:1} }
        @keyframes wol-pop-in  { from{opacity:0;transform:scale(0.88) translateY(24px)} to{opacity:1;transform:scale(1) translateY(0)} }

        .wol-card:hover { filter: brightness(0.97); }
      `}</style>

      {/* ── Wall ── */}
      <section style={{
        width:"100%", minHeight:"100vh",
        background: transparentBg ? "transparent" : `
          radial-gradient(ellipse 80% 60% at 0%   50%, rgba(151,24,251,0.10)  0%, transparent 60%),
          radial-gradient(ellipse 80% 60% at 100% 50%, rgba(113,128,254,0.10) 0%, transparent 60%),
          radial-gradient(ellipse 70% 70% at 50%  0%,  rgba(196,181,253,0.14) 0%, transparent 55%),
          var(--background)
        `,
        display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"60px 0", overflow:"hidden",
        fontFamily:"'Outfit', sans-serif",
      }}>
        <Row items={row1} direction="left"  speed={65} paletteOffset={0} onCardClick={(c,p) => setSelected({ card:c, paletteIndex:p })} />
        <Row items={row2} direction="right" speed={75} paletteOffset={2} onCardClick={(c,p) => setSelected({ card:c, paletteIndex:p })} />
        <Row items={row3} direction="left"  speed={58} paletteOffset={4} onCardClick={(c,p) => setSelected({ card:c, paletteIndex:p })} />
      </section>

      {/* ── Modal (mounts on top, wall keeps scrolling) ── */}
      {selected && (
        <Modal
          card={selected.card}
          paletteIndex={selected.paletteIndex}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
