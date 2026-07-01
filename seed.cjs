const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('c:/Softwares/Luter/.env', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '');
});

const supabase = createClient(supabaseUrl, supabaseKey);

const templates = [
  { title: "Complete your <strong>Profile</strong> setup", url: "/profile" },
  { title: "Set a <strong>Daily Study Goal</strong>", url: "/settings" },
  { title: "Explore the <strong>Backpack</strong>", url: "/backpack" },
  { title: "Create your first <strong>Folder</strong>", url: "/backpack" },
  { title: "Upload a <strong>PDF Document</strong>", url: "/upload" },
  { title: "Read a document in the <strong>Workstation</strong>", url: "/workstation" },
  { title: "Create your first <strong>Flashcard Deck</strong>", url: "/decks?new=1" },
  { title: "Study 10 <strong>Flashcards</strong>", url: "/decks" },
  { title: "Take a <strong>Mock Exam</strong>", url: "/mock-exam" },
  { title: "Write a <strong>Study Note</strong>", url: "/notes?new=1" },
  { title: "Use <strong>AI Chat</strong> to understand a topic", url: "/ai-chat" },
  { title: "Check your <strong>Analytics</strong>", url: "/analytics" },
  { title: "Visit the <strong>Coin Store</strong>", url: "/store" },
  { title: "Equip a new <strong>Avatar</strong>", url: "/profile" },
  { title: "Join a <strong>Study Group</strong>", url: "/study-groups" },
  { title: "Send a message in a <strong>Group Chat</strong>", url: "/study-groups" },
  { title: "Play a match of <strong>Knowledge Heist</strong>", url: "/heist" },
  { title: "Compete in the <strong>Playground</strong>", url: "/compete" },
  { title: "Refer a <strong>Friend</strong> to Luter", url: "/refer" },
  { title: "Read the <strong>Wall of Love</strong>", url: "/wall-of-love" },
];

const generatedTasks = [];
let orderIndex = 1;

templates.forEach(t => {
  generatedTasks.push({
    title: t.title,
    action_url: t.url,
    coins_reward: Math.floor(Math.random() * 15) + 5,
    xp_reward: Math.floor(Math.random() * 20) + 10,
    order_index: orderIndex++,
    is_active: true
  });
});

const streaks = [3, 7, 14, 21, 30, 50, 100, 150, 200, 365];
streaks.forEach(days => {
  generatedTasks.push({
    title: "Reach a <strong>" + days + "-Day Streak</strong>",
    action_url: "/streak",
    coins_reward: days * 2,
    xp_reward: days * 5,
    order_index: orderIndex++,
    is_active: true
  });
});

for (let lvl = 2; lvl <= 20; lvl++) {
  generatedTasks.push({
    title: "Reach <strong>Level " + lvl + "</strong>",
    action_url: "/profile",
    coins_reward: lvl * 5,
    xp_reward: lvl * 10,
    order_index: orderIndex++,
    is_active: true
  });
}

const fcMilestones = [50, 100, 250, 500, 1000];
fcMilestones.forEach(amount => {
  generatedTasks.push({
    title: "Study <strong>" + amount + " Flashcards</strong>",
    action_url: "/decks",
    coins_reward: Math.floor(amount / 5),
    xp_reward: Math.floor(amount / 2),
    order_index: orderIndex++,
    is_active: true
  });
});

const examMilestones = [5, 10, 25, 50];
examMilestones.forEach(amount => {
  generatedTasks.push({
    title: "Complete <strong>" + amount + " Mock Exams</strong>",
    action_url: "/mock-exam",
    coins_reward: amount * 5,
    xp_reward: amount * 10,
    order_index: orderIndex++,
    is_active: true
  });
});

let fillerCount = 100 - generatedTasks.length;
for (let i = 1; i <= fillerCount; i++) {
  generatedTasks.push({
    title: "Complete <strong>Daily Study Challenge #" + i + "</strong>",
    action_url: "/home",
    coins_reward: 10,
    xp_reward: 20,
    order_index: orderIndex++,
    is_active: true
  });
}

async function seedTasks() {
  console.log('Deleting existing tasks...');
  const { error: delErr } = await supabase.from('explore_tasks').delete().gte('order_index', 0);
  if (delErr) {
    console.error('Delete error:', delErr);
    return;
  }

  console.log('Inserting ' + generatedTasks.length + ' tasks...');
  const { error: insertErr } = await supabase.from('explore_tasks').insert(generatedTasks);
  
  if (insertErr) {
    console.error('Insert error:', insertErr);
  } else {
    console.log('Successfully seeded 100 tasks into explore_tasks!');
  }
}

seedTasks();
