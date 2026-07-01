const fs = require('fs');

const widgetPath = 'c:/Softwares/Luter/src/components/dashboard/ExploreTasksWidget.jsx';
let widgetContent = fs.readFileSync(widgetPath, 'utf-8');

// Update useState
const oldUseState = `  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);`;

const newUseState = `  const [tasks, setTasks] = useState(() => {
    try {
      const cached = localStorage.getItem('explore_tasks_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.map(t => ({
          ...t,
          title: <span dangerouslySetInnerHTML={{ __html: t.titleRaw }} />
        }));
      }
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(tasks.length === 0);`;

widgetContent = widgetContent.replace(oldUseState, newUseState);

// Update loadTasks to save to cache
const oldLoadTasks = `        if (!error && data && data.length > 0) {
          const formattedTasks = data.map((t, index) => ({
            id: t.id,
            title: <span dangerouslySetInnerHTML={{ __html: t.title }} />,
            completed: index === 0, // Make the first one completed by default for demo
            isClaimed: false, // For local tracking
            coins: t.coins_reward || t.xp_reward || 0
          }));
          setTasks(formattedTasks);
        } else {`;

const newLoadTasks = `        if (!error && data && data.length > 0) {
          const formattedTasks = data.map((t, index) => ({
            id: t.id,
            titleRaw: t.title,
            title: <span dangerouslySetInnerHTML={{ __html: t.title }} />,
            completed: index === 0, // Make the first one completed by default for demo
            isClaimed: false, // For local tracking
            coins: t.coins_reward || t.xp_reward || 0
          }));
          setTasks(formattedTasks);
          try {
            localStorage.setItem('explore_tasks_cache', JSON.stringify(formattedTasks.map(t => ({...t, title: undefined}))));
          } catch(e) {}
        } else {`;

widgetContent = widgetContent.replace(oldLoadTasks, newLoadTasks);

fs.writeFileSync(widgetPath, widgetContent);
console.log('ExploreTasksWidget updated for local caching');

// Update DashboardHome.jsx
const dashPath = 'c:/Softwares/Luter/src/components/dashboard/DashboardHome.jsx';
let dashContent = fs.readFileSync(dashPath, 'utf-8');

const oldDashState = `  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(true)`;

const newDashState = `  const [tasks, setTasks] = useState(() => {
    try {
      const cached = localStorage.getItem('dash_explore_tasks');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  })
  const [loadingTasks, setLoadingTasks] = useState(tasks.length === 0)`;

dashContent = dashContent.replace(oldDashState, newDashState);

// Inside fetchTasks
const oldDashFetch = `        setTasks(data.map((t, index) => ({
          ...t,
          done: index === 0, // Mock first task as done
          isDynamic: true
        })))
      } else {
        setTasks([])
      }`;

const newDashFetch = `        const formattedTasks = data.map((t, index) => ({
          ...t,
          done: index === 0, // Mock first task as done
          isDynamic: true
        }));
        setTasks(formattedTasks);
        try { localStorage.setItem('dash_explore_tasks', JSON.stringify(formattedTasks)); } catch(e){}
      } else {
        // keep cached tasks or clear
        if (tasks.length === 0) setTasks([]);
      }`;

dashContent = dashContent.replace(oldDashFetch, newDashFetch);

fs.writeFileSync(dashPath, dashContent);
console.log('DashboardHome updated for local caching');
