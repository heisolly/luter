const fs = require('fs');

const data = JSON.parse(fs.readFileSync('parsed_courses.json', 'utf8'));

// Helper to convert HTML SVG string to JSX
function htmlToJsx(html) {
  if (!html) return 'null';
  
  return html
    .replace(/class=/g, 'className=')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/fill-opacity=/g, 'fillOpacity=')
    .replace(/clip-path=/g, 'clipPath=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/color-interpolation-filters=/g, 'colorInterpolationFilters=')
    .replace(/xmlns:xlink=/g, 'xmlnsXlink=');
}

let mockDataStr = 'const courses = [\n';
data.forEach(course => {
  mockDataStr += `  {
    id: ${course.id},
    title: ${JSON.stringify(course.title)},
    level: ${JSON.stringify(course.level)},
    levelColor: ${JSON.stringify(course.levelColor)},
    badge: ${course.badge ? JSON.stringify(course.badge) : 'null'},
    image: ${JSON.stringify(course.image)},
    items: [
`;
  course.items.forEach(item => {
    mockDataStr += `      {
        title: ${JSON.stringify(item.title)},
        active: ${item.active},
        icon: (
          ${htmlToJsx(item.iconHTML)}
        )
      },
`;
  });
  mockDataStr += `    ]
  },
`;
});
mockDataStr += '];\n';

let swiperFile = fs.readFileSync('src/components/dashboard/CourseCardSwiper.jsx', 'utf8');

// Replace everything between `const courses = [` and `];` with mockDataStr
const startIdx = swiperFile.indexOf('const courses = [');
const endIdx = swiperFile.indexOf('];', startIdx) + 2;

swiperFile = swiperFile.slice(0, startIdx) + mockDataStr + swiperFile.slice(endIdx);

fs.writeFileSync('src/components/dashboard/CourseCardSwiper.jsx', swiperFile);
console.log('Patched CourseCardSwiper.jsx successfully!');
